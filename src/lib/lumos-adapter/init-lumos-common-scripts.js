import {
  parseFromInfo,
  common as commonScripts,
} from "@ckb-lumos/common-scripts";
import { addCellDep } from "@ckb-lumos/common-scripts/lib/helper";

export function buildJoyidCobuildPocLockInfo(ckbChainConfig) {
  return buildLockInfo(
    ckbChainConfig,
    ckbChainConfig.SCRIPTS.JOYID_COBUILD_POC,
  );
}

export function buildLockInfo(ckbChainConfig, scriptInfo) {
  return {
    codeHash: scriptInfo.CODE_HASH,
    hashType: scriptInfo.HASH_TYPE,
    // we'll use cobuild to sign transactions, so don't need to implement functions for signing in lumos.
    lockScriptInfo: {
      CellCollector: class {
        constructor(fromInfo, cellProvider, { config, queryOptions }) {
          if (!cellProvider) {
            throw new Error(`Cell provider is missing!`);
          }
          config = config ?? ckbChainConfig;
          const script = parseFromInfo(fromInfo, { config }).fromScript;

          if (
            script.codeHash !== scriptInfo.CODE_HASH ||
            script.hashType !== scriptInfo.HASH_TYPE
          ) {
            return;
          }

          // Now we can apply the queryOptions to search the live cells.
          queryOptions ??= {};
          queryOptions = {
            ...queryOptions,
            lock: script,
            type: queryOptions.type ?? "empty",
          };

          this.cellCollector = cellProvider.collector(queryOptions);
        }

        async *collect() {
          if (this.cellCollector) {
            for await (const inputCell of this.cellCollector.collect()) {
              yield inputCell;
            }
          }
        }
      },

      // What to do when a inputCell has been found by the cell provider.
      // - Add input and output cell
      // - Add cell deps.
      // - Fill witness to make fee calculation correct.
      //   - CoBuild will handle the witness, skip filling witness in lumos
      setupInputCell: async (
        txSkeleton,
        inputCell,
        _fromInfo,
        { config, since },
      ) => {
        // use default config when config is not provided
        config ??= ckbChainConfig;
        const txMutable = txSkeleton.asMutable();

        //===========================
        // I. Common Skeletons
        //
        // There are many steps that setupInputCell must perform carefully, otherwise the whole transaction builder will fail.
        //===========================
        // 1.Add inputCell to txSkeleton
        txMutable.update("inputs", (inputs) => inputs.push(inputCell));

        // 2. Add output. The function `lumos.commons.common.transfer` will scan outputs for available balance for each account.
        const outputCell = {
          cellOutput: {
            ...inputCell.cellOutput,
          },
          data: inputCell.data,
        };
        txMutable.update("outputs", (outputs) => outputs.push(outputCell));

        // 3. Set Since
        if (since) {
          txMutable.setIn(
            ["inputSinces", txMutable.get("inputs").size - 1],
            since,
          );
        }

        //===========================
        // II. CellDeps
        //===========================
        const scriptOutPoint = {
          txHash: scriptInfo.TX_HASH,
          index: scriptInfo.INDEX,
        };
        // The helper method addCellDep avoids adding duplicated cell deps.
        addCellDep(txMutable, {
          outPoint: scriptOutPoint,
          depType: scriptInfo.DEP_TYPE,
        });

        return txMutable.asImmutable();
      },
    },
  };
}

let inited = false;

export default function initLumosCommonScripts(ckbChainConfig) {
  if (!inited) {
    commonScripts.registerCustomLockScriptInfos([
      buildJoyidCobuildPocLockInfo(ckbChainConfig),
    ]);
    inited = true;
  }
}
