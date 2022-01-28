package config

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestConfigErrorWithNoBotToken(t *testing.T) {
	testConfig := AppConfig{
		DiscordBotToken: "",
	}
	validateError := validateConfig(testConfig)
	assert.Errorf(t, validateError, "Didn't receive an validate error on config: %+v", testConfig)
}

func TestValidConfigWithBotToken(t *testing.T) {
	testConfig := AppConfig{
		DiscordBotToken: "Fake.Token.Here",
	}
	validateError := validateConfig(testConfig)
	assert.NoError(t, validateError)
}
