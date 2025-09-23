function giaiThua(n: number): number {
    return n <= 1 ? 1 : n * giaiThua(n - 1);
  }
  
  function poissonTruyenThong(lambda: number, k: number): number {
    return (Math.pow(lambda, k) * Math.exp(-lambda)) / giaiThua(k);
  }
  
  export function duDoanTySo(lambdaNha: number, lambdaKhach: number) {
    const ketQua: { tySo: string; xacSuat: number }[] = [];
    for (let n = 0; n <= 5; n++) {
      for (let k = 0; k <= 5; k++) {
        const xs = poissonTruyenThong(lambdaNha, n) * poissonTruyenThong(lambdaKhach, k);
        ketQua.push({ tySo: `${n}-${k}`, xacSuat: xs });
      }
    }
    ketQua.sort((a, b) => b.xacSuat - a.xacSuat);
    return ketQua.slice(0, 2);
  }
  
  export function duDoanOverUnder(lambdaNha: number, lambdaKhach: number, muc: number = 2.5) {
    let pOver = 0;
    let pUnder = 0;
    for (let n = 0; n <= 6; n++) {
      for (let k = 0; k <= 6; k++) {
        const xs = poissonTruyenThong(lambdaNha, n) * poissonTruyenThong(lambdaKhach, k);
        if (n + k > muc) pOver += xs;
        else pUnder += xs;
      }
    }
    return { muc, over: pOver, under: pUnder, luaChon: pOver > pUnder ? "Over" : "Under" };
  }
  
  export function duDoanKeoGoc() {
    return "Chưa có dữ liệu kèo góc.";
  }
  