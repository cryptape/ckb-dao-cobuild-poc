all: web contract

web:
	pnpm lint
	pnpm test

contract:
	make -f contracts.mk build
	make CARGO_ARGS="-- --nocapture" -f contracts.mk test

.PHONY: all web contract
