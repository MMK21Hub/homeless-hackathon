const SERVICE_UUID = 0xae30
const SERVICE_UUID_ALT = 0xaf30
const CONTROL_CHARACTERISTIC = 0xae01
const NOTIFY_CHARACTERISTIC = 0xae02
const DATA_CHARACTERISTIC = 0xae03

const GET_STATUS = 0xa1
const SET_INTENSITY = 0xa2
const PRINT_REQUEST = 0xa9
const PRINT_COMPLETE = 0xaa
const FLUSH_DATA = 0xad

const PRINTER_WIDTH = 384
const ROW_BYTES = PRINTER_WIDTH / 8
const MIN_DATA_BYTES = 90 * ROW_BYTES
const DEFAULT_INTENSITY = 0x5d
const DEFAULT_PACING_MS = 15

export type Dither = "floyd-steinberg" | "threshold" | "none"

export interface PrintOptions {
  dither?: Dither
  intensity?: number
  pacingMs?: number
  rotate180?: boolean
}

export interface TextOptions extends PrintOptions {
  fontFamily?: string
  fontSize?: number
  fontWeight?: string
  align?: "left" | "center" | "right"
  lineSpacing?: number
}

export interface Bitmap {
  width: number
  height: number
  data: Uint8Array
}

interface Waiter {
  resolve: (payload: Uint8Array | null) => void
  timer: number
}

export class Mxw01Printer {
  private device: BluetoothDevice | null = null
  private server: BluetoothRemoteGATTServer | null = null
  private controlCharacteristic: BluetoothRemoteGATTCharacteristic | null = null
  private notifyCharacteristic: BluetoothRemoteGATTCharacteristic | null = null
  private dataCharacteristic: BluetoothRemoteGATTCharacteristic | null = null
  private waiters = new Map<number, Waiter>()
  private debug: boolean

  constructor(options: { debug?: boolean } = {}) {
    this.debug = options.debug ?? false
  }

  async connect(): Promise<void> {
    if (!navigator.bluetooth) {
      throw new Error("Web Bluetooth is not available in this browser")
    }

    this.device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [SERVICE_UUID] }, { services: [SERVICE_UUID_ALT] }],
      optionalServices: [SERVICE_UUID, SERVICE_UUID_ALT],
    })
    this.log("Connected to printer model:", this.device.name ?? "(unknown)")
    this.device.addEventListener("gattserverdisconnected", this.handleDisconnect)

    if (!this.device.gatt) {
      throw new Error("Bluetooth GATT not available")
    }

    this.server = await this.device.gatt.connect()
    const service = await this.getService(this.server)

    this.controlCharacteristic = await service.getCharacteristic(CONTROL_CHARACTERISTIC)
    this.notifyCharacteristic = await service.getCharacteristic(NOTIFY_CHARACTERISTIC)
    this.dataCharacteristic = await service
      .getCharacteristic(DATA_CHARACTERISTIC)
      .catch(() => this.controlCharacteristic!)

    await this.notifyCharacteristic.startNotifications()
    this.notifyCharacteristic.addEventListener(
      "characteristicvaluechanged",
      this.handleNotification,
    )
  }

  async disconnect(): Promise<void> {
    if (this.notifyCharacteristic) {
      this.notifyCharacteristic.removeEventListener(
        "characteristicvaluechanged",
        this.handleNotification,
      )
      try {
        await this.notifyCharacteristic.stopNotifications()
      } catch (error) {
        this.log("Error stopping notifications:", error)
      }
    }

    if (this.device) {
      this.device.removeEventListener("gattserverdisconnected", this.handleDisconnect)
    }

    if (this.server?.connected) {
      this.server.disconnect()
    }

    this.device = null
    this.server = null
    this.controlCharacteristic = null
    this.notifyCharacteristic = null
    this.dataCharacteristic = null
    this.log("Disconnected from printer")
  }

  isConnected(): boolean {
    return this.server?.connected === true && this.controlCharacteristic !== null
  }

  async printImage(url: string, options: PrintOptions = {}): Promise<void> {
    const bitmap = await imageToBitmap(url, options)
    await this.printBitmap(bitmap, options)
  }

  async printText(text: string, options: TextOptions = {}): Promise<void> {
    const bitmap = textToBitmap(text, options)
    await this.printBitmap(bitmap, options)
  }

  async printBitmap(bitmap: Bitmap, options: PrintOptions = {}): Promise<void> {
    if (!this.isConnected()) {
      throw new Error("Printer not connected")
    }

    const data = padToMinimum(bitmap.data)
    const lineCount = data.length / ROW_BYTES

    await this.writeControl(
      makeCommand(SET_INTENSITY, new Uint8Array([options.intensity ?? DEFAULT_INTENSITY])),
    )
    await sleep(100)

    const statusPromise = this.waitForNotification(GET_STATUS, 3000)
    await this.writeControl(makeCommand(GET_STATUS, new Uint8Array([0])))
    const status = await statusPromise
    if (status) {
      this.log("Printer status:", hex(status))
      this.assertStatusOk(status)
    } else {
      this.log("No status response, continuing")
    }

    const acceptPromise = this.waitForNotification(PRINT_REQUEST, 7000)
    await this.writeControl(
      makeCommand(
        PRINT_REQUEST,
        new Uint8Array([lineCount & 0xff, (lineCount >> 8) & 0xff, 0x30, 0x00]),
      ),
    )
    const accept = await acceptPromise
    if (!accept) {
      throw new Error("Printer did not acknowledge the print request")
    }
    if (accept.length > 0 && accept[0] !== 0) {
      throw new Error(`Printer rejected the print request: 0x${accept[0].toString(16)}`)
    }

    const pacingMs = options.pacingMs ?? DEFAULT_PACING_MS
    for (let offset = 0; offset < data.length; offset += ROW_BYTES) {
      await this.writeData(data.subarray(offset, offset + ROW_BYTES))
      await sleep(pacingMs)
    }

    await this.writeControl(makeCommand(FLUSH_DATA, new Uint8Array([0])))

    const completion = await this.waitForNotification(
      PRINT_COMPLETE,
      15000 + (lineCount / 15) * 1000,
    )
    this.log(
      completion ? "Print complete" : "No print-complete notification received",
    )
  }

  private async getService(
    server: BluetoothRemoteGATTServer,
  ): Promise<BluetoothRemoteGATTService> {
    try {
      return await server.getPrimaryService(SERVICE_UUID)
    } catch {
      return await server.getPrimaryService(SERVICE_UUID_ALT)
    }
  }

  private async writeControl(data: Uint8Array): Promise<void> {
    await this.write(this.controlCharacteristic, data)
  }

  private async writeData(data: Uint8Array): Promise<void> {
    await this.write(this.dataCharacteristic, data)
  }

  private async write(
    characteristic: BluetoothRemoteGATTCharacteristic | null,
    data: Uint8Array,
  ): Promise<void> {
    if (!characteristic) {
      throw new Error("Printer not properly connected")
    }

    this.log("Sending data:", hex(data))

    if (characteristic.properties.writeWithoutResponse) {
      await characteristic.writeValueWithoutResponse(data)
    } else {
      await characteristic.writeValue(data)
    }
  }

  private waitForNotification(
    command: number,
    timeoutMs: number,
  ): Promise<Uint8Array | null> {
    return new Promise((resolve) => {
      const timer = window.setTimeout(() => {
        this.waiters.delete(command)
        resolve(null)
      }, timeoutMs)

      this.waiters.set(command, { resolve, timer })
    })
  }

  private handleNotification = (event: Event): void => {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic
    if (!characteristic.value) return

    const view = characteristic.value
    const bytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
    this.log("Received data:", hex(bytes))

    if (bytes.length < 6 || bytes[0] !== 0x22 || bytes[1] !== 0x21) return

    const command = bytes[2]
    const length = bytes[4] | (bytes[5] << 8)
    const payload = bytes.slice(6, 6 + length)
    const waiter = this.waiters.get(command)
    if (!waiter) return

    window.clearTimeout(waiter.timer)
    this.waiters.delete(command)
    waiter.resolve(payload)
  }

  private handleDisconnect = (): void => {
    this.log("Printer disconnected")
    this.server = null
    this.controlCharacteristic = null
    this.notifyCharacteristic = null
    this.dataCharacteristic = null
  }

  private assertStatusOk(payload: Uint8Array): void {
    if (payload.length < 13 || payload[12] === 0) return

    const code = payload.length > 13 ? payload[13] : 0
    const reasons: Record<number, string> = {
      1: "out of paper",
      4: "overheated",
      8: "low battery",
      9: "out of paper",
    }
    throw new Error(
      `Printer not ready: ${reasons[code] ?? `error code 0x${code.toString(16)}`}`,
    )
  }

  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log("[MXW01]", ...args)
    }
  }
}

function makeCommand(command: number, payload: Uint8Array): Uint8Array {
  const packet = new Uint8Array(6 + payload.length + 2)
  packet.set([
    0x22,
    0x21,
    command,
    0x00,
    payload.length & 0xff,
    (payload.length >> 8) & 0xff,
  ])
  packet.set(payload, 6)
  packet[6 + payload.length] = crc8(payload)
  packet[7 + payload.length] = 0xff
  return packet
}

function crc8(bytes: Uint8Array): number {
  let crc = 0
  for (const byte of bytes) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x80 ? ((crc << 1) ^ 0x07) & 0xff : (crc << 1) & 0xff
    }
  }
  return crc
}

function padToMinimum(data: Uint8Array): Uint8Array {
  if (data.length >= MIN_DATA_BYTES) return data
  const padded = new Uint8Array(MIN_DATA_BYTES)
  padded.set(data)
  return padded
}

async function imageToBitmap(
  url: string,
  options: PrintOptions,
): Promise<Bitmap> {
  const image = await loadImage(url)
  const height = Math.max(
    1,
    Math.round((PRINTER_WIDTH * image.naturalHeight) / image.naturalWidth),
  )
  const canvas = document.createElement("canvas")
  canvas.width = PRINTER_WIDTH
  canvas.height = height

  const context = canvas.getContext("2d", { willReadFrequently: true })!
  context.fillStyle = "#fff"
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  return canvasToBitmap(canvas, options)
}

function textToBitmap(text: string, options: TextOptions): Bitmap {
  const fontSize = options.fontSize ?? 24
  const lineSpacing = options.lineSpacing ?? 8
  const lines = text.split("\n")
  const canvas = document.createElement("canvas")
  canvas.width = PRINTER_WIDTH
  canvas.height = Math.max(
    1,
    Math.ceil(lines.length * (fontSize + lineSpacing) + lineSpacing),
  )

  const context = canvas.getContext("2d", { willReadFrequently: true })!
  context.fillStyle = "#fff"
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = "#000"
  context.font = `${options.fontWeight ? `${options.fontWeight} ` : ""}${fontSize}px ${
    options.fontFamily ?? "sans-serif"
  }`
  context.textAlign = options.align ?? "left"

  const x =
    context.textAlign === "center"
      ? canvas.width / 2
      : context.textAlign === "right"
        ? canvas.width
        : 0

  lines.forEach((line, index) => {
    context.fillText(
      line,
      x,
      lineSpacing + fontSize + index * (fontSize + lineSpacing),
    )
  })

  return canvasToBitmap(canvas, options)
}

function canvasToBitmap(
  source: HTMLCanvasElement,
  options: PrintOptions,
): Bitmap {
  let canvas = source

  if (options.rotate180 !== false) {
    canvas = document.createElement("canvas")
    canvas.width = source.width
    canvas.height = source.height
    const context = canvas.getContext("2d", { willReadFrequently: true })!
    context.translate(canvas.width, canvas.height)
    context.rotate(Math.PI)
    context.drawImage(source, 0, 0)
  }

  const context = canvas.getContext("2d", { willReadFrequently: true })!
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const gray = new Uint8Array(canvas.width * canvas.height)

  for (let i = 0; i < gray.length; i++) {
    const offset = i * 4
    gray[i] =
      (imageData.data[offset] +
        imageData.data[offset + 1] +
        imageData.data[offset + 2]) /
      3
  }

  if (options.dither === "floyd-steinberg") {
    floydSteinberg(gray, canvas.width, canvas.height)
  }

  const data = new Uint8Array(Math.ceil(gray.length / 8))
  for (let i = 0; i < gray.length; i++) {
    if (gray[i] < 128) {
      data[i >> 3] |= 1 << (i & 7)
    }
  }

  return { width: canvas.width, height: canvas.height, data }
}

function floydSteinberg(
  gray: Uint8Array,
  width: number,
  height: number,
): void {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x
      const oldValue = gray[index]
      const newValue = oldValue < 128 ? 0 : 255
      gray[index] = newValue
      const error = oldValue - newValue

      if (x + 1 < width) {
        gray[index + 1] = clamp(gray[index + 1] + (error * 7) / 16)
      }
      if (y + 1 < height) {
        if (x > 0) {
          gray[index + width - 1] = clamp(
            gray[index + width - 1] + (error * 3) / 16,
          )
        }
        gray[index + width] = clamp(gray[index + width] + (error * 5) / 16)
        if (x + 1 < width) {
          gray[index + width + 1] = clamp(
            gray[index + width + 1] + error / 16,
          )
        }
      }
    }
  }
}

function clamp(value: number): number {
  return Math.max(0, Math.min(255, value))
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Failed to load image: ${url}`))
    image.src = url
  })
}

function hex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join(" ")
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}
