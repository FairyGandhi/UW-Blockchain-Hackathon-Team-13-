// @nearfile
import { context, storage, logging, PersistentMap } from "near-sdk-as";

// --- contract code goes below

const balances = new PersistentMap<string, u64>("b:");
const approves = new PersistentMap<string, u64>("a:");
const shoes    = new PersistentMap<string, string[]>("s:");
const shoePrices = new PersistentMap<string, u64>("s:");

const TOTAL_SUPPLY: u64 = 1000000;
export function init(initialOwner: string): void {
  logging.log("initialOwner: " + initialOwner);
  assert(storage.get<string>("init") == null, "Already initialized token supply");
  balances.set(initialOwner, TOTAL_SUPPLY);
  storage.set("init", "done");
}

export function produceShoes (barCode: string, info: string[], price: u64): void {
    shoes.set(barCode, info);
    shoePrices.set(barCode, price);
}

export function authenticate (barCode: string): boolean {
    if (shoes.contains(barCode))
        return true;
    else
        return false;
}

export function getShoeInfo (barCode: string): string[] {
    if (shoes.contains(barCode))
        return shoes.getSome(barCode);
    else
        return [];
}

export function getPrice (barCode: string): u64 {
    if (shoePrices.contains(barCode))
        return shoePrices.getSome(barCode);
    else
        return 0;
}

export function buyShoes (barCode: string, from: string, to: string): boolean {
    assert(shoes.contains(barCode), "The show is not authenticated");
    const balance = balances.getSome(from);
    const price = shoePrices.getSome(barCode);
    assert(balance >= price, "Account does not have enough money");
        
    return transferFrom(to, from, price);
}

export function totalSupply(): string {
  return TOTAL_SUPPLY.toString();
}

export function balanceOf(tokenOwner: string): u64 {
  logging.log("balanceOf: " + tokenOwner);
  if (!balances.contains(tokenOwner)) {
    return 0;
  }
  const result = balances.getSome(tokenOwner);
  return result;
}

export function allowance(tokenOwner: string, spender: string): u64 {
  const key = tokenOwner + ":" + spender;
  if (!approves.contains(key)) {
    return 0;
  }
  return approves.getSome(key);
}

export function transfer(to: string, tokens: u64): boolean {
  logging.log("transfer from: " + context.sender + " to: " + to + " tokens: " + tokens.toString());
  const fromAmount = getBalance(context.sender);
  assert(fromAmount >= tokens, "not enough tokens on account");
  balances.set(context.sender, fromAmount - tokens);
  balances.set(to, getBalance(to) + tokens);
  return true;
}

export function approve(spender: string, tokens: u64): boolean {
  logging.log("approve: " + spender + " tokens: " + tokens.toString());
  approves.set(context.sender + ":" + spender, tokens);
  return true;
}

export function transferFrom(from: string, to: string, tokens: u64): boolean {
  const fromAmount = getBalance(from);
  assert(fromAmount >= tokens, "not enough tokens on account");
  const approvedAmount = allowance(from, to);
  // assert(tokens <= approvedAmount, "not enough tokens approved to transfer");
  balances.set(from, fromAmount - tokens);
  balances.set(to, getBalance(to) + tokens);
  return true;
}

function getBalance(owner: string): u64 {
  return balances.contains(owner) ? balances.getSome(owner) : 0;
}
