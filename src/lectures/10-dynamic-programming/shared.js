import {parseArray} from "../../core/utils.js";

export const copy = value => structuredClone(value);
export const cellKey = (i,j) => `${i},${j}`;
export const at = (F,i,j) => F[cellKey(i,j)] ?? null;
export const tableText = (F,n,W) => Array.from({length:n+1},(_,i) =>
  `i=${i}: ${Array.from({length:W+1},(_,j) => `${j}:${at(F,i,j) ?? "not computed"}`).join(", ")}`).join("; ");
export const oneRow = F => F.map((value,i) => `${i}:${value ?? "not computed"}`).join("; ");
export const indexList = indices => indices.length ? indices.join(", ") : "none";

export function parseFib(raw,maximum) {
  const text=String(raw).trim(), n=Number(text);
  if (!/^\d+$/.test(text) || !Number.isInteger(n) || n<0 || n>maximum) {
    throw new Error(`Enter a nonnegative integer n from 0 to ${maximum}.`);
  }
  return n;
}
export function parseCoins(raw) {
  const coins=parseArray(raw,{min:1,max:10});
  if (coins.some(value=>!Number.isInteger(value)||value<1||value>99)) throw new Error("Use 1–10 positive integer coin values from 1 to 99.");
  return coins;
}
export function parseDpKnapsack(raw) {
  const parts=String(raw).split("|");
  if(parts.length!==2) throw new Error("Enter capacity | weight:value pairs, for example 5 | 2:12,1:10,3:20,2:15.");
  const text=parts[0].trim(), capacity=Number(text);
  if(!/^\d+$/.test(text)||!Number.isInteger(capacity)||capacity>20) throw new Error("Capacity W must be a whole number from 0 to 20.");
  const entries=parts[1].split(",").map(entry=>entry.trim());
  if(!parts[1].trim()||entries.length>6) throw new Error("Enter 1–6 items as weight:value pairs.");
  const items=entries.map((entry,index)=>{
    const pair=entry.split(":").map(part=>part.trim());
    if(pair.length!==2||pair.some(part=>!/^\d+$/.test(part))) throw new Error(`Item ${index+1} must use integer weight:value form.`);
    const [weight,value]=pair.map(Number);
    if(weight<1||weight>99) throw new Error(`Item ${index+1} weight must be from 1 to 99.`);
    if(value<0||value>99) throw new Error(`Item ${index+1} value must be from 0 to 99.`);
    return {weight,value};
  });
  return {capacity,items};
}
