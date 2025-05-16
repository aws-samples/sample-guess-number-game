package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

func main() {
	// Default port
	port := "8084"

	// Check if port is provided as an environment variable
	if envPort := os.Getenv("PORT"); envPort != "" {
		port = envPort
	}

	// Create a file server handler
	fs := http.FileServer(http.Dir("."))

	// Create a wrapper handler for root path that checks auth
	rootHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Only check auth for root path
		if r.URL.Path == "/" {
			auth := r.URL.Query().Get("auth")
			if auth != "gamelift" {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}
		}
		fs.ServeHTTP(w, r)
	})

	// Register the handler
	http.Handle("/", rootHandler)

	// Start the server
	fmt.Printf("Starting server on port %s...\n", port)
	fmt.Printf("Open http://localhost:%s in your browser\n", port)

	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}
