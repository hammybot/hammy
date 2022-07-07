package main

import "testing"

func TestNewSessionWithEnv(t *testing.T) {
	t.Setenv(botTokenEnv, "ABCDEFG")

	s, err := createDiscordSession()
	if err != nil {
		t.Errorf("expected no err, received err: %v", err)
	}

	if s == nil {
		t.Error("expected a session struct, received nil")
	}
}

func TestSessionErrNoEnv(t *testing.T) {
	t.Setenv(botTokenEnv, "")

	_, err := createDiscordSession()
	if err == nil {
		t.Error("expected err creating session, did not receive one")
	}
}
