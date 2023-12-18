.PHONY: test
test: integration-test

.PHONY: integration-test
integration-test: build-on-demand
	capsule test

.PHONY: build-on-demand
build-on-demand: target/riscv64imac-unknown-none-elf/debug/joyid-cobuild-poc

target/riscv64imac-unknown-none-elf/debug/joyid-cobuild-poc:
	capsule build

.PHONY: build
build:
	capsule build

.PHONY: release
release:
	capsule build --release
