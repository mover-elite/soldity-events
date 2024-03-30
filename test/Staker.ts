import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { expect } from "chai";
import { ethers } from "hardhat";

const initialSupply = ethers.parseEther("100000000000");

describe("Staker", () => {
  const stakeAmount = ethers.parseEther("100");
  const deployContract = async () => {
    const stakeToken = await ethers.deployContract("Token", [
      "Stake Token",
      "STK",
      initialSupply,
    ]);

    const rewardToken = await ethers.deployContract("Token", [
      "Reward Token",
      "RWT",
      initialSupply,
    ]);
    const staker = await ethers.deployContract("Staker", [
      rewardToken.target,
      stakeToken.target,
    ]);
    await rewardToken.transfer(staker.target, initialSupply);
    return { stakeToken, rewardToken, staker };
  };

  it("Should stake", async () => {
    const [signer] = await ethers.getSigners();
    const { staker, stakeToken } = await loadFixture(deployContract);

    await stakeToken.approve(staker.target, initialSupply);
    await expect(staker.stake(stakeAmount))
      .to.emit(staker, "Stake")
      .withArgs(stakeAmount);
    const userStake = await staker.stakes(signer.address);
    expect(userStake.amount).to.equal(stakeAmount);
  });

  it("Should claim stake reward", async () => {
    const [signer] = await ethers.getSigners();
    const { staker, stakeToken, rewardToken } = await loadFixture(
      deployContract
    );
    await stakeToken.approve(staker.target, initialSupply);
    const stakeRes = await staker.stake(stakeAmount);
    const stakeBlock = await stakeRes.getBlock();
    await time.increase(999);
    const claim = await staker.claim();
    expect(claim).to.emit(staker, "Claim").to.emit(rewardToken, "Transfer");
    const userStake = await staker.stakes(signer.address);
    expect(userStake.time).to.gt(stakeBlock?.timestamp);
  });

  it("Should withdraw stake", async () => {
    const [signer] = await ethers.getSigners();
    const { staker, stakeToken } = await loadFixture(deployContract);
    await stakeToken.approve(staker.target, initialSupply);
    await staker.stake(stakeAmount);
    await time.increase(999);
    const withdrawRes = await staker.withdraw();
    expect(withdrawRes).to.emit(staker, "Claim").to.emit(staker, "Withdraw");
    const userStake = await staker.stakes(signer.address);
    expect(userStake.amount).to.equal(0n);
  });
});
