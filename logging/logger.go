package logging

type Logger interface {
	Log(logLevel LogLevel, args ...interface{})
}
