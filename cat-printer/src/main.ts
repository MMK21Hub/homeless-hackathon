import "./style.css"
import { CatPrinter } from "@opuu/cat-printer"

// Create a new instance with debug logging enabled
const printer = new CatPrinter({ debug: true })

// Connect to the printer
async function connectPrinter() {
  try {
    await printer.connect()
    console.log("Connected to printer!")

    // Print text with custom options
    await printer.printText("Hello World!", {
      fontSize: 24,
      fontWeight: "bold",
      align: "center",
      lineSpacing: 8,
    })

    // Print an image using Floyd-Steinberg dithering
    await printer.printImage(
      "https://cdn.hackclub.com/01a163dc-6149-73a5-8232-6064815f0aea/Pasted%20image.png",
      {
        dither: "floyd-steinberg",
      },
    )

    // Feed the paper to finalize the printing job
    await printer.feed(100)

    // Disconnect when the job is done
    await printer.disconnect()
  } catch (error) {
    console.error("Error during printing:", error)
  }
}

// Bind the connect function to a button click event
const connectButton = document.getElementById("connectButton")
connectButton!.addEventListener("click", connectPrinter)
