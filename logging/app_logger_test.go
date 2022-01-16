package logging

import (
	"testing"

	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/assert"
)

func TestConvertLevelToError(t *testing.T) {
	logrusLevel := getLogrusLevel(Error)

	assert.Equal(t, logrus.ErrorLevel, logrusLevel)
}

func TestDefaultLevelToError(t *testing.T) {
	logrusLevel := getLogrusLevel("INCORRECT")

	assert.Equal(t, logrus.ErrorLevel, logrusLevel)
}

func TestConvertLevelToInfo(t *testing.T) {
	logrusLevel := getLogrusLevel(Info)

	assert.Equal(t, logrus.InfoLevel, logrusLevel)
}

func TestConvertLevelToDebug(t *testing.T) {
	logrusLevel := getLogrusLevel(Debug)

	assert.Equal(t, logrus.DebugLevel, logrusLevel)
}
