package logging

import (
	"os"

	"github.com/sirupsen/logrus"
)

type appLogger struct {
	Logger
	internalLogger *logrus.Logger
}

func CreateAppLogger(logLevel LogLevel) Logger {
	var logrusLogger = &logrus.Logger{
		Out:       os.Stderr,
		Formatter: new(logrus.TextFormatter),
		Hooks:     make(logrus.LevelHooks),
		Level:     getLogrusLevel(logLevel),
	}
	appLogger := &appLogger{internalLogger: logrusLogger}
	return appLogger
}

func (appLogger appLogger) Log(logLevel LogLevel, args ...interface{}) {
	logrusLevel := getLogrusLevel(logLevel)
	appLogger.internalLogger.Log(logrusLevel, args...)
}

func getLogrusLevel(logLevel LogLevel) logrus.Level {
	switch logLevel {
	case Error:
		return logrus.ErrorLevel
	case Debug:
		return logrus.DebugLevel
	case Info:
		return logrus.InfoLevel
	default:
		return logrus.ErrorLevel
	}
}
