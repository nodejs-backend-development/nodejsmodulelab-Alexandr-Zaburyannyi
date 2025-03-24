/** @format */

const http = require("http");
const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

const host = "localhost";
const port = 8000;

const server = http.createServer((req, res) => {
  if (req.url === "/task1") {
    (function task1() {
      const expectedAuthHeader =
        "Bearer ekV5Rk4wMlgvYVpCbmp5WUh5bHVPMktwMzktY05QeDRjT3FlWlNiUTJhbVpraHc5d3Y5a3YtU2pM";
      const authHeader = req.headers.authorization;

      if (authHeader === expectedAuthHeader) {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("Authorization successful");
      } else {
        res.writeHead(401, { "Content-Type": "text/plain" });
        res.end("Unauthorized");
      }
    })();
  } else if (req.url === "/task2") {
    (function task2() {
      if (req.method === "POST") {
        console.log("Receiving compressed file...");

        const chunks = [];
        req.on("data", (chunk) => {
          chunks.push(chunk);
        });

        req.on("end", () => {
          const compressedData = Buffer.concat(chunks);

          zlib.gunzip(compressedData, (err, decompressed) => {
            if (err) {
              console.error("Error decompressing data:", err);
              res.writeHead(500, { "Content-Type": "text/plain" });
              res.end("Error decompressing file");
              return;
            }

            const outputPath = path.join(__dirname, "received_file.txt");
            fs.writeFile(outputPath, decompressed, (writeErr) => {
              if (writeErr) {
                console.error("Error writing file:", writeErr);
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("Error saving file");
                return;
              }

              console.log(`File saved to ${outputPath}`);
              res.writeHead(200, { "Content-Type": "text/plain" });
              res.end("File received and saved successfully");
            });
          });
        });
      } else {
        res.writeHead(405, { "Content-Type": "text/plain" });
        res.end("Method Not Allowed");
      }
    })();
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);

  (function clientTest() {
    const filePath = path.join(__dirname, "test.txt");

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(
        filePath,
        "This is a test file that will be compressed and sent to the server."
      );
      console.log(`Created test file: ${filePath}`);
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error("Error reading file:", err);
        return;
      }

      zlib.gzip(data, (compressionError, compressed) => {
        if (compressionError) {
          console.error("Error compressing data:", compressionError);
          return;
        }

        const options = {
          hostname: host,
          port,
          path: "/task2",
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "Content-Encoding": "gzip",
          },
        };

        const req = http.request(options, (res) => {
          console.log(`Status: ${res.statusCode}`);

          let responseData = "";
          res.on("data", (chunk) => {
            responseData += chunk;
          });

          res.on("end", () => {
            console.log("Server response:", responseData);
          });
        });

        req.on("error", (e) => {
          console.error("Error sending request:", e.message);
        });

        req.write(compressed);
        req.end();
      });
    });
  })();
});
