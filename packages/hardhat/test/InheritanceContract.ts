import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { InheritanceContract } from "../typechain-types";

describe("InheritanceContract", function () {
    let inheritanceContract: InheritanceContract;
    let owner: SignerWithAddress;
    let heir: SignerWithAddress;
    let otherAccount: SignerWithAddress;

    beforeEach(async function () {
        [owner, heir, otherAccount] = await ethers.getSigners();
        const InheritanceContractFactory = await ethers.getContractFactory("InheritanceContract");
        inheritanceContract = await InheritanceContractFactory.deploy(heir.address) as InheritanceContract;
        await inheritanceContract.waitForDeployment();
    });

    it("Should set the correct owner and heir", async function () {
        expect(await inheritanceContract.owner()).to.equal(owner.address);
        expect(await inheritanceContract.heir()).to.equal(heir.address);
    });

    it("Should allow owner to withdraw", async function () {
        await owner.sendTransaction({ to: await inheritanceContract.getAddress(), value: ethers.parseEther("1") });
        await expect(inheritanceContract.withdraw(ethers.parseEther("0.5")))
            .to.changeEtherBalance(owner, ethers.parseEther("0.5"));
    });

    it("Should allow heir to claim ownership after 30 days", async function () {
        await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
        await ethers.provider.send("evm_mine");
        await inheritanceContract.connect(heir).claimOwnership();
        expect(await inheritanceContract.owner()).to.equal(heir.address);
    });

    it("Should not allow heir to claim ownership before 30 days", async function () {
        await expect(inheritanceContract.connect(heir).claimOwnership()).to.be.revertedWith("Inheritance period not passed");
    });

    it("Should allow owner to reset inheritance period", async function () {
        await inheritanceContract.resetInheritancePeriod();
        await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60 - 1]);
        await ethers.provider.send("evm_mine");
        await expect(inheritanceContract.connect(heir).claimOwnership()).to.be.revertedWith("Inheritance period not passed");
    });

    it("Should allow heir to change heir after claiming ownership", async function () {
        await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
        await ethers.provider.send("evm_mine");
        await inheritanceContract.connect(heir).claimOwnership();
        await inheritanceContract.connect(heir).changeHeir(otherAccount.address);
        expect(await inheritanceContract.heir()).to.equal(otherAccount.address);
    });

    it("Should correctly calculate time left before heir ownership", async function () {
        const initialTimeLeft = await inheritanceContract.getTimeLeftBeforeHeirOwnership();
        expect(initialTimeLeft).to.be.closeTo(BigInt(30 * 24 * 60 * 60), BigInt(5)); // Allow small deviation due to block time

        await ethers.provider.send("evm_increaseTime", [15 * 24 * 60 * 60]);
        await ethers.provider.send("evm_mine");

        const halfwayTimeLeft = await inheritanceContract.getTimeLeftBeforeHeirOwnership();
        expect(halfwayTimeLeft).to.be.closeTo(BigInt(15 * 24 * 60 * 60), BigInt(5));

        await ethers.provider.send("evm_increaseTime", [15 * 24 * 60 * 60]);
        await ethers.provider.send("evm_mine");

        const finalTimeLeft = await inheritanceContract.getTimeLeftBeforeHeirOwnership();
        expect(finalTimeLeft).to.equal(0);
    });
});