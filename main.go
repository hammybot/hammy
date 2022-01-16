package main

import (
	"os"

	"github.com/austinvalle/hammy/logging"
)

func main() {
	os.Exit(realMain())
}

func realMain() int {
	logger := logging.CreateAppLogger(logging.Info)
	logger.Log(logging.Info, "Hello World!")

	return 0
}
