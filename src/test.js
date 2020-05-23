describe('Token', function() {
  let near;
  let contract;
  let bank;
  let bob = 'bob.near';
  let eve = 'eve.near';

  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

  beforeAll(async function() {
    console.log('nearConfig', nearConfig);
    near = await nearlib.connect(nearConfig);
    bank = nearConfig.contractName;
    contract = await near.loadContract(nearConfig.contractName, {
      // NOTE: This configuration only needed while NEAR is still in development
      viewMethods: ['totalSupply', 'balanceOf', 'allowance', 'authenticate', 'getShoeInfo', 'getPrice'],
      changeMethods: ['init', 'transfer', 'approve', 'transferFrom', 'produceShoes', 'buyShoes'],
      sender: bank
    });
  });

  describe('with bank as initial owner', function() {
    beforeAll(async function() {
      await contract.init({ initialOwner: bank });

      const bankStartBalance = await contract.balanceOf({tokenOwner: bank});
      expect(bankStartBalance).toBe('1000000');
    });

    it('can authenticate shoes', async function(){
        await contract.produceShoes({barCode: "Air Jordan 1", info: ["Brand: Nike", "FactoryID: 1234", "Production date: 20200523", "Size: M"], price: '500'});
        const result = await contract.authenticate({barCode: "Air Jordan 1"});
        expect(result).toBe(true);
    });

    it('get shoe price', async function(){
        await contract.produceShoes({barCode: "Air Jordan 1", info: ["Brand: Nike", "FactoryID: 1234", "Production date: 20200523", "Size: M"], price: '500'});
        const result = await contract.getPrice({barCode: "Air Jordan 1"});
        expect(parseInt(result)).toBe(500);
    });

    it('buy shoes with tokens', async function(){
        const bankStartBalance = await contract.balanceOf({tokenOwner: bank});
        const eveStartBalance = await contract.balanceOf({tokenOwner: eve});

        await contract.transfer({ to: bob, tokens: '100' });
        await contract.transfer({ to: eve, tokens: '100' });

        await contract.produceShoes({barCode: "Air Jordan 1", info: ["Brand: Nike", "FactoryID: 1234", "Production date: 20200523", "Size: M"], price: '20'});
        const result = await contract.buyShoes({barCode: "Air Jordan 1", from: bob, to: eve});
         
        expect(result).toBe(true);
    });

    it('can transfer to other account', async function() {
      const bankStartBalance = await contract.balanceOf({tokenOwner: bank});
      const bobStartBalance = await contract.balanceOf({tokenOwner: bob});

      await contract.transfer({ to: bob, tokens: '100' });

      const bankEndBalance = await contract.balanceOf({tokenOwner: bank});
      const bobEndBalance = await contract.balanceOf({tokenOwner: bob});
      expect(parseInt(bankEndBalance)).toBe(parseInt(bankStartBalance) - 100);
      expect(parseInt(bobEndBalance)).toBe(parseInt(bobStartBalance) + 100);
    });

    it('can transfer from approved account to another account', async function() {
      const bankStartBalance = await contract.balanceOf({tokenOwner: bank});
      const bobStartBalance = await contract.balanceOf({tokenOwner: bob});
      const eveStartBalance = await contract.balanceOf({tokenOwner: eve});

      await contract.approve({ spender: eve, tokens: '100' });

      const bankMidBalance = await contract.balanceOf({tokenOwner: bank});
      const bobMidBalance = await contract.balanceOf({tokenOwner: bob});
      const eveMidBalance = await contract.balanceOf({tokenOwner: eve});
      expect(bankMidBalance).toBe(bankStartBalance);
      expect(bobMidBalance).toBe(bobStartBalance);
      expect(eveMidBalance).toBe(eveStartBalance);

      // TODO: Use "eve" as sender
      await contract.transferFrom({ from: bank, to: eve, tokens: '50' });

      const bankEndBalance = await contract.balanceOf({tokenOwner: bank});
      const bobEndBalance = await contract.balanceOf({tokenOwner: bob});
      const eveEndBalance = await contract.balanceOf({tokenOwner: eve});
      expect(parseInt(bankEndBalance)).toBe(parseInt(bankStartBalance) - 50);
      expect(bobEndBalance).toBe(bobStartBalance);
      expect(parseInt(eveEndBalance)).toBe(parseInt(eveStartBalance) + 50);
    });
  });
});
