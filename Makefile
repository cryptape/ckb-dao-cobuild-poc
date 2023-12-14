.PHONY: test
test: integration-test

.PHONY: integration-test
integration-test: build-on-demand
	capsule test

.PHONY: build-on-demand
build-on-demand: deps/ckb-auth/build/auth_libecc target/riscv64imac-unknown-none-elf/debug/joyid-cobuild-poc

target/riscv64imac-unknown-none-elf/debug/joyid-cobuild-poc:
	capsule build

deps/ckb-auth/build/auth_libecc: build-ckb-auth

deps/ckb-auth/deps/libecc/src/libec.h:
	git submodule update --init --recursive

.PHONY: build-ckb-auth
build-ckb-auth: deps/ckb-auth/deps/libecc/src/libec.h
	make -C deps/ckb-auth all-via-docker

.PHONY: build
build: deps/ckb-auth/deps/libecc/src/libec.h
	capsule build
