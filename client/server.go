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
	// First try using executable's directory as base
	execPath, err := os.Executable()
	if err != nil {
		log.Printf("Warning: Could not get executable path: %v", err)
	} else {
		execDir := filepath.Dir(execPath)
		// Try to find client directory starting from executable's location
		dir := execDir
		for {
			// Check if client directory exists in current directory
			clientPath := filepath.Join(dir, "client")
			if _, err := os.Stat(clientPath); err == nil {
				return clientPath
			}

			// Move up one directory
			parent := filepath.Dir(dir)
			if parent == dir {
				break // We've reached the root directory
			}
			dir = parent
		}
	}

	// If not found from executable path, try from current working directory
	cwd, err := os.Getwd()
	if err != nil {
		log.Fatal(err)
	}

	// First check if we're already in the client directory
	if strings.HasSuffix(cwd, "client") {
		return cwd
	}

	// Try to find client directory by walking up from current directory
	dir := cwd
	for {
		// Check if client directory exists in current directory
		clientPath := filepath.Join(dir, "client")
		if _, err := os.Stat(clientPath); err == nil {
			return clientPath
		}

		// Move up one directory
		parent := filepath.Dir(dir)
		if parent == dir {
			break // We've reached the root directory
		}
		dir = parent
	}

	// If we get here, we couldn't find the client directory
	log.Fatalf("Could not locate client directory from either executable path or working directory. Tried from: %s", cwd)
	return ""
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
