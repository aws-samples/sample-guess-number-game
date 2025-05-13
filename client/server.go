package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

// ensureClientDirectory ensures we're serving from the client directory
func ensureClientDirectory() string {
	// Get the current working directory
	cwd, err := os.Getwd()
	if err != nil {
		log.Fatal(err)
	}

	// Check if we're in the client directory
	if !strings.HasSuffix(cwd, "client") {
		// If we're not in the client directory, try to find it
		if strings.Contains(cwd, "client") {
			// We're in a subdirectory of client, move up to client
			for !strings.HasSuffix(cwd, "client") {
				cwd = filepath.Dir(cwd)
			}
		} else {
			// Check if client directory exists in current path
			if _, err := os.Stat("client"); err == nil {
				cwd = filepath.Join(cwd, "client")
			} else {
				log.Fatal("Could not locate client directory")
			}
		}
	}

	return cwd
}

func main() {
	// Default port
	port := "8000"

	// Check if port is provided as an environment variable
	if envPort := os.Getenv("PORT"); envPort != "" {
		port = envPort
	}

	// Get the client directory path
	clientDir := ensureClientDirectory()

	// Create a file server handler that only serves from the client directory
	fs := http.FileServer(http.Dir(clientDir))

	log.Printf("Serving files from: %s\n", clientDir)

	// Handle requests
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// If it's the root path, serve index.html
		if r.URL.Path == "/" {
			indexPath := filepath.Join(clientDir, "index.html")
			http.ServeFile(w, r, indexPath)
			return
		}

		// For all other paths, use the file server
		// Strip the leading "/" to make paths relative to clientDir
		r.URL.Path = strings.TrimPrefix(r.URL.Path, "/")
		fs.ServeHTTP(w, r)
	})

	// Start the server
	fmt.Printf("Starting server on port %s...\n", port)
	fmt.Printf("Open http://localhost:%s in your browser\n", port)

	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}
