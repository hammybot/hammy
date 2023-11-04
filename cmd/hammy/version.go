package main

import (
	"runtime/debug"
)

var (
	// These vars will be set by goreleaser.
	version string
	commit  string
)

type BinaryInfo struct {
	Version string
	Commit  string
}

func getBinaryInfo() BinaryInfo {
	info := BinaryInfo{
		Version: "local",
	}

	// Prefer global version as it's set by goreleaser via ldflags
	// https://goreleaser.com/cookbooks/using-main.version/
	if version != "" {
		info.Version = version

		if commit != "" {
			info.Commit = commit
		}

		return info
	}

	// If not built with goreleaser, check the binary for VCS revision/module version info
	if build, ok := debug.ReadBuildInfo(); ok {
		info.Version = build.Main.Version

		for _, setting := range build.Settings {
			if setting.Key == "vcs.revision" {
				info.Commit = setting.Value
			}
		}
	}

	return info
}
