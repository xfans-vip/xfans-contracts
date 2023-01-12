// This is an example test file. Hardhat will run every *.js file in `test/`,
// so feel free to add new ones.

// Hardhat tests are normally written with Mocha and Chai.

// We import Chai to use its asserting functions here.
const { expect } = require("chai");

// We use `loadFixture` to share common setups (or fixtures) between tests.
// Using this simplifies your tests and makes them run faster, by taking
// advantage or Hardhat Network's snapshot functionality.
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

// `describe` is a Mocha function that allows you to organize your tests.
// Having your tests organized makes debugging them easier. All Mocha
// functions are available in the global scope.
//
// `describe` receives the name of a section of your test suite, and a
// callback. The callback must define the tests of that section. This callback
// can't be an async function.
describe("Subscribe contract", function () {
  // We define a fixture to reuse the same setup in every test. We use
  // loadFixture to run this setup once, snapshot that state, and reset Hardhat
  // Network to that snapshot in every test.
  async function deployTokenFixture() {
    // Get the ContractFactory and Signers here.
    const factory = await ethers.getContractFactory("Subscribe");
    const [owner, addr1, addr2,addr3] = await ethers.getSigners();
    //console.info('address:',owner, 'addr1:',addr1, 'addr2:',addr2);

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens onces its transaction has been
    // mined.
    const contract = await factory.deploy();

    await contract.deployed();

    // Fixtures can return anything you consider useful for your tests
    return { factory, contract, owner, addr1, addr2,addr3 };
  }

  // You can nest describe calls to create subsections.
  describe("Deployment", function () {
    // `it` is another Mocha function. This is the one you use to define your
    // tests. It receives the test name, and a callback function.
    //
    // If the callback function is async, Mocha will `await` it.
    it("Should set the right owner", async function () {
      // We use loadFixture to setup our environment, and then assert that
      // things went well
      const { contract, owner } = await loadFixture(deployTokenFixture);

      // Expect receives a value and wraps it in an assertion object. These
      // objects have a lot of utility methods to assert values.

      // This test expects the owner variable stored in the contract to be
      // equal to our Signer's owner.
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("Should owner have 0 token", async function () {
      const { contract, owner } = await loadFixture(deployTokenFixture);
      const ownerBalance = await contract.balanceOf(owner.address);
      expect(ownerBalance).eq(0);
    });
    
  });

  describe("function", async function () {

    it("Should set operator ok", async function () {
      const { contract, owner ,addr1} = await loadFixture(deployTokenFixture);
      await contract.setOperator(addr1.address)
      expect(await contract.opertator()).eq(addr1.address)
     // expect(await contract.mint(owner,addr1,1,1)).to.be.revertedWith("opertator only")

    });
    
 
    it("mint should revert", async function () {
      const { contract, owner ,addr1,addr2} = await loadFixture(deployTokenFixture);
      // await ;
      
      expect(await contract.opertator()).hexEqual("0x00000000000000000000000000000000000");
      await expect( contract.mint(addr1.address)).revertedWith("opt only")
      await expect( contract.mint(owner.address)).revertedWith("opt only")
      await expect( contract.mintWithMeta(addr1.address,addr1.address,1,2)).to.be.revertedWith('opt only')
      await expect( contract.mintWithMeta(owner.address,addr1.address,1,2)).to.be.reverted
      
    });
    
 
    it("mint should ok", async function () {
      const { contract, owner ,addr1} = await loadFixture(deployTokenFixture);
      // await ;
      await contract.setOperator(addr1.address);

      let signer1 =await contract.connect(addr1);

      await signer1.mint(addr1.address);
      expect(await signer1.ownerOf(1)).eq(addr1.address)
      await signer1.mint(addr1.address);
      expect(await signer1.ownerOf(2)).eq(addr1.address)
      await signer1.mint(addr1.address);//returns a tx object
      expect(await signer1.ownerOf(3)).eq(addr1.address)
      expect(await signer1.balanceOf(addr1.address)).eq(3)
    });
    
 
 
    it.only("mintWithMeta should ok", async function () {
      const { contract, owner ,addr1,addr2,addr3} = await loadFixture(deployTokenFixture);
      // await ;
      await contract.setOperator(addr1.address);
    
      expect(await contract.currentId()).eq(0)

      await contract.connect(addr1).mintWithMeta(addr2.address,addr3.address,1,2);
      expect(await contract.currentId()).eq(1)
      let tokenId =1;
      expect(await contract.ownerOf(tokenId)).eq(addr2.address)
      let meta = await contract.getMeta(tokenId);
      expect(meta.author).eq(addr3.address)
      
      await expect(contract.connect(addr1).setOperator(addr3.address)).revertedWith("Ownable: caller is not the owner");
      await contract.connect(owner).setOperator(addr3.address)
      
      await expect( contract.connect(addr1).mintWithMeta(owner.address,addr1.address,1,2)).to.be.reverted
      expect(await contract.currentId()).eq(1)

      await contract.connect(addr3).mintWithMeta(addr2.address,addr3.address,1,2);
      expect(await contract.currentId()).eq(2)

      expect(await contract.ownerOf(2)).eq(addr2.address)
      expect(await contract.balanceOf(addr2.address)).eq(2)
    });
    
 
 
 
    it("baseuri ok", async function () {
      const { contract, owner ,addr1,addr2,addr3} = await loadFixture(deployTokenFixture);
      let baseuri = "ipfs://ffff/"
      await expect( contract.connect(addr1).setBaseURI(baseuri)).reverted
      
      await contract.connect(owner).setBaseURI(baseuri)

      await contract.setOperator(addr3.address);
      await contract.connect(addr3).mintWithMeta(addr2.address,addr3.address,1,2);
    

      expect(await contract.tokenURI(1)).eq("ipfs://ffff/".concat(1))
 
    });
    
 
 
    it.only("approval ok", async function () {
      const { contract, owner ,addr1,addr2,addr3} = await loadFixture(deployTokenFixture);


      await contract.setOperator(addr3.address);
      await contract.connect(addr3).mintWithMeta(addr2.address,addr3.address,1,2);
    

      expect(await contract.getApproved(1)).hexEqual('0x00000000000000000000000000000000000');
      await contract.connect(addr2).approve(owner.address,1);
      expect(await contract.getApproved(1)).hexEqual(owner.address);
     
      await expect(contract.connect(addr3).transferFrom(addr2.address,addr1.address,1)).to.be.reverted
      await contract.connect(addr3).operatorApprovalForAll(addr2.address);
      expect(await contract.isApprovedForAll(addr2.address,addr3.address)).eq(true);
      await contract.connect(addr3).transferFrom(addr2.address,addr1.address,1);

      expect(await contract.ownerOf(1)).eq(addr1.address)
    });
    
 
    
  });

  
});
