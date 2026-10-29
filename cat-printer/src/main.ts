import "./style.css"
import { Mxw01Printer } from "./mxw01"

const printer = new Mxw01Printer({ debug: true })

async function connectPrinter() {
  try {
    await printer.connect()
    console.log("Connected to printer!")

    await printer.printImage(
      "https://cdn.hackclub.com/01a163dc-6149-73a5-8232-6064815f0aea/Pasted%20image.png",
      {
        dither: "floyd-steinberg",
      },
    )

    console.log("Printing finished!")
    await printer.disconnect()
  } catch (error) {
    console.error("Error during printing:", error)
  }
}

const connectButton = document.getElementById("connectButton")
connectButton!.addEventListener("click", connectPrinter)
