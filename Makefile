CARGO_TEST_ARGS := -- --nocapture

all: web contract

web:
	pnpm lint
	pnpm test

contract: schemas
	make -f contracts.mk build
	make CARGO_ARGS="${CARGO_TEST_ARGS}" -f contracts.mk test

SCHEMA_MOL_FILES := $(wildcard schemas/*.mol)
SCHEMA_RUST_FILES := $(patsubst %.mol,crates/ckb-dao-cobuild-schemas/src/%.rs,$(SCHEMA_MOL_FILES))
crates/ckb-dao-cobuild-schemas/src/%.rs: %.mol
	moleculec --language rust --schema-file $< > $@
	cargo fmt

schemas: $(SCHEMA_RUST_FILES)
clean-schemas:
	rm -f $(SCHEMA_RUST_FILES)

.PHONY: all web contract schemas clean-schemas
