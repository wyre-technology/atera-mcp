## [1.1.5](https://github.com/wyre-technology/atera-mcp/compare/v1.1.4...v1.1.5) (2026-04-06)


### Bug Fixes

* **ci:** add DOM lib and node types to tsconfig, install deps for MCPB step ([f3b4061](https://github.com/wyre-technology/atera-mcp/commit/f3b4061b0ca29f00379b13ae0e8a911ec3111bf0))

## [1.1.4](https://github.com/wyre-technology/atera-mcp/compare/v1.1.3...v1.1.4) (2026-04-06)


### Bug Fixes

* **ci:** fix all node -p shell quoting in release workflow ([cc12980](https://github.com/wyre-technology/atera-mcp/commit/cc12980081f2568391c4005241ce2ae2e947eae9))

## [1.1.3](https://github.com/wyre-technology/atera-mcp/compare/v1.1.2...v1.1.3) (2026-04-06)


### Bug Fixes

* **ci:** escape parentheses in Docker build workflow shell command ([10b0e33](https://github.com/wyre-technology/atera-mcp/commit/10b0e33762372d38b69f42ea78eebcd48f0cbfb7))

## [1.1.2](https://github.com/wyre-technology/atera-mcp/compare/v1.1.1...v1.1.2) (2026-04-06)


### Bug Fixes

* allow unauthenticated tools/list in gateway mode ([998a9b9](https://github.com/wyre-technology/atera-mcp/commit/998a9b958f20c853a54b0946c39bd6f56a572497))

## [1.1.1](https://github.com/wyre-technology/atera-mcp/compare/v1.1.0...v1.1.1) (2026-03-31)


### Bug Fixes

* **deploy:** replace node_compat with nodejs_compat for Wrangler v4 ([b03c21c](https://github.com/wyre-technology/atera-mcp/commit/b03c21cf83d0b1b55ebe639f722201fd7595c9a6))

# [1.1.0](https://github.com/wyre-technology/atera-mcp/compare/v1.0.2...v1.1.0) (2026-03-10)


### Features

* **elicitation:** add MCP elicitation support with graceful fallback ([dd3549c](https://github.com/wyre-technology/atera-mcp/commit/dd3549cf716b88b533383d24b5ec8f6b29f8d77c))

## [1.0.2](https://github.com/wyre-technology/atera-mcp/compare/v1.0.1...v1.0.2) (2026-03-02)


### Bug Fixes

* **ci:** fix broken YAML in Discord notification step ([10f5787](https://github.com/wyre-technology/atera-mcp/commit/10f5787afec8edade96999f25c25c459138d3d9c))
* **ci:** move Discord notification into release workflow ([a36df20](https://github.com/wyre-technology/atera-mcp/commit/a36df209d0304f2096b38d4d5c422619a0ae28f3))

## [1.0.1](https://github.com/wyre-technology/atera-mcp/compare/v1.0.0...v1.0.1) (2026-02-26)


### Bug Fixes

* pass GITHUB_TOKEN as build arg for Docker npm ci authentication ([6201a3d](https://github.com/wyre-technology/atera-mcp/commit/6201a3df51d8fddcf7f81d3b3e6879cf3b38996d))
* pass GITHUB_TOKEN build-arg to Docker build for GitHub Packages auth ([a6ea833](https://github.com/wyre-technology/atera-mcp/commit/a6ea83310f56bf0fe9f4ab8a135eddbe6d11d412))

# 1.0.0 (2026-02-23)


### Bug Fixes

* add missing semantic-release plugin dependencies ([3cc06b4](https://github.com/wyre-technology/atera-mcp/commit/3cc06b4b6e0b699f1cc3783e5b967e6a34cf03b7))
* **ci:** add GitHub Packages auth for npm ci ([f06a2a1](https://github.com/wyre-technology/atera-mcp/commit/f06a2a1eaafc75e9045867d5e301ab7b52534e34))
* **ci:** convert pack-mcpb.js to ESM imports ([9ab1eeb](https://github.com/wyre-technology/atera-mcp/commit/9ab1eeb73936ea76a3975b1dac66f028848892f1))
* **ci:** update lock file and bump node to 22 ([8d63503](https://github.com/wyre-technology/atera-mcp/commit/8d63503799ded1c062e661848d8cbdf86b9c8dc0))
* **docker:** drop arm64 platform to fix QEMU build failures ([1511339](https://github.com/wyre-technology/atera-mcp/commit/1511339f75ba81240a88bd01ae8d09754033fd3d))
* escape newlines in .releaserc.json message template ([0bbc4e8](https://github.com/wyre-technology/atera-mcp/commit/0bbc4e8297824e88f53ec588bcc30f63d4e819bc))
* quote MCPB bundle filename to prevent shell glob expansion failure ([97fe277](https://github.com/wyre-technology/atera-mcp/commit/97fe2774dc4fc7973b5a0ceb0090e9610e33177e))
* rename duplicate step id in docker job ([26f66d1](https://github.com/wyre-technology/atera-mcp/commit/26f66d18d395adc77ff97af00fd561da2fa545ec))


### Features

* add MCPB manifest for desktop installation ([9724e3f](https://github.com/wyre-technology/atera-mcp/commit/9724e3fad1d2864378a039907a3474dcfcfbbf41))
* add MCPB pack script ([9f6a05b](https://github.com/wyre-technology/atera-mcp/commit/9f6a05baba42b9799fde1f00209ef187a51c4ac4))
* add mcpb packaging support ([33356c2](https://github.com/wyre-technology/atera-mcp/commit/33356c2b236b76e7fc97273e0f4c1d666ade2c49))
* add mcpb packaging support ([418f682](https://github.com/wyre-technology/atera-mcp/commit/418f6821d0af11d1616479b028dce8616dda1222))
* add mcpb packaging support ([385f47d](https://github.com/wyre-technology/atera-mcp/commit/385f47d1094e1a401bee3dcebf6dea9e39ee1f8e))
* add mcpb packaging support ([da59aef](https://github.com/wyre-technology/atera-mcp/commit/da59aef2292685b0d9f41b5ea2bdb6a65b1e819b))
* add mcpb packaging support ([1b9011a](https://github.com/wyre-technology/atera-mcp/commit/1b9011a8208a450af3d2bef721fbd7cd8f9104c8))
* add one-click deploy badges to README ([7447b89](https://github.com/wyre-technology/atera-mcp/commit/7447b8966b7a07ee7705b1e523a29ea3571b6244))
* Implement Atera MCP server with decision tree architecture ([b9903dd](https://github.com/wyre-technology/atera-mcp/commit/b9903ddbbb6465d19ec096706b8bf12ac63d92d9))
* **transport:** Add HTTP transport, Docker, and deployment configs ([de70468](https://github.com/wyre-technology/atera-mcp/commit/de70468d3610c73552e52a2a7e5efd6049d21849))
