package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

func main() {
	// Default port
	port := "8000"

	// Check if port is provided as an environment variable
	if envPort := os.Getenv("PORT"); envPort != "" {
		port = envPort
	}

	// Create a file server handler and serve from the current directory
	fs := http.FileServer(http.Dir("."))

	// Register the file server handler
	http.Handle("/", fs)

	// Start the server
	fmt.Printf("Starting server on port %s...\n", port)
	fmt.Printf("Open http://localhost:%s in your browser\n", port)

	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}
