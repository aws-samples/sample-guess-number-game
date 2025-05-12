# Output directory
OUT_DIR := out

# Component directories
CLIENT_DIR := $(OUT_DIR)/client
LOBBY_DIR := $(OUT_DIR)/lobby-server
LOBBY_GL_DIR := $(OUT_DIR)/lobby-server-gamelift
BATTLE_DIR := $(OUT_DIR)/battle-server

# Default target
.PHONY: all
all: client lobby-server lobby-server-gamelift battle-server

# Create output directories
$(OUT_DIR):
	mkdir -p $(OUT_DIR)

$(CLIENT_DIR): $(OUT_DIR)
	mkdir -p $(CLIENT_DIR)

$(LOBBY_DIR): $(OUT_DIR)
	mkdir -p $(LOBBY_DIR)

$(LOBBY_GL_DIR): $(OUT_DIR)
	mkdir -p $(LOBBY_GL_DIR)

$(BATTLE_DIR): $(OUT_DIR)
	mkdir -p $(BATTLE_DIR)

# Build client
.PHONY: client
client: $(CLIENT_DIR)
	cd client && go build -o ../$(CLIENT_DIR)/client
	cp client/index.html $(CLIENT_DIR)/
	cp -r client/css $(CLIENT_DIR)/
	cp -r client/js $(CLIENT_DIR)/

# Build lobby-server
.PHONY: lobby-server
lobby-server: $(LOBBY_DIR)
	cd lobby-server && go build -o ../$(LOBBY_DIR)/lobby-server

# Build lobby-server-gamelift
.PHONY: lobby-server-gamelift
lobby-server-gamelift: $(LOBBY_GL_DIR)
	cd lobby-server-gamelift && go build -o ../$(LOBBY_GL_DIR)/lobby-server-gamelift

# Build battle-server
.PHONY: battle-server
battle-server: $(BATTLE_DIR)
	cd battle-server && go build -o ../$(BATTLE_DIR)/battle-server

# Clean target
.PHONY: clean
clean:
	rm -rf $(OUT_DIR)
