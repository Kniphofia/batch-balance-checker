// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20Balance {
    function balanceOf(address account) external view returns (uint256);
}

/// @title BatchBalanceChecker
/// @notice Batch query EVM native currency and ERC-20 balances. address(0) represents the native currency.
contract BatchBalanceChecker {
    /// @notice Query multiple assets for a single account. Results strictly match the order of `assets`.
    /// @param account The address to query balances for.
    /// @param assets address(0) represents native currency; other addresses represent ERC-20 contracts.
    function getBalances(
        address account,
        address[] calldata assets
    ) external view returns (uint256[] memory balances) {
        return _balances(account, assets);
    }

    /// @notice Backward-compatible entrypoint with standard Balance Checker ABI; supports mixed native and token queries.
    function tokensBalance(
        address owner,
        address[] calldata contracts
    ) external view returns (uint256[] memory balances) {
        return _balances(owner, contracts);
    }

    /// @notice Batch query native currency balances for multiple accounts.
    function etherBalances(
        address[] calldata addresses
    ) external view returns (uint256[] memory balances) {
        uint256 length = addresses.length;
        balances = new uint256[](length);
        for (uint256 i; i < length; ++i) {
            balances[i] = addresses[i].balance;
        }
    }

    /// @notice Query the same asset across multiple accounts; token == address(0) queries native currency.
    function tokenBalances(
        address[] calldata addresses,
        address token
    ) external view returns (uint256[] memory balances) {
        uint256 length = addresses.length;
        balances = new uint256[](length);
        for (uint256 i; i < length; ++i) {
            balances[i] = _assetBalance(addresses[i], token);
        }
    }

    /// @notice Multi-account and multi-asset query; returns balances[accountIndex][assetIndex].
    function tokensBalances(
        address[] calldata addresses,
        address[] calldata contracts
    ) external view returns (uint256[][] memory balances) {
        uint256 addressCount = addresses.length;
        uint256 assetCount = contracts.length;
        balances = new uint256[][](addressCount);

        for (uint256 i; i < addressCount; ++i) {
            uint256[] memory row = new uint256[](assetCount);
            for (uint256 j; j < assetCount; ++j) {
                row[j] = _assetBalance(addresses[i], contracts[j]);
            }
            balances[i] = row;
        }
    }

    function _balances(
        address account,
        address[] calldata assets
    ) internal view returns (uint256[] memory balances) {
        uint256 length = assets.length;
        balances = new uint256[](length);
        for (uint256 i; i < length; ++i) {
            balances[i] = _assetBalance(account, assets[i]);
        }
    }

    function _assetBalance(
        address account,
        address asset
    ) internal view returns (uint256) {
        if (asset == address(0)) {
            return account.balance;
        }

        if (asset.code.length == 0) {
            return 0;
        }

        (bool success, bytes memory data) = asset.staticcall(
            abi.encodeWithSelector(IERC20Balance.balanceOf.selector, account)
        );

        if (!success || data.length < 32) {
            return 0;
        }

        uint256 amount;
        assembly {
            // Read first 32-byte word to tolerate non-compliant tokens and prevent revert on trailing bytes
            amount := mload(add(data, 0x20))
        }
        return amount;
    }
}
