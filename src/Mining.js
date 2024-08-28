import React, { useState, useEffect } from 'react';
import Web3 from 'web3';

function Mining({ account, contract, web3 }) {
  const [vertBalance, setVertBalance] = useState(0);
  const [stakeAmount, setStakeAmount] = useState('');
  const [stakes, setStakes] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalStaked, setTotalStaked] = useState(0);
  const [bnbPrice, setBnbPrice] = useState(0);
  const [withdrawals, setWithdrawals] = useState([]);

  const MIN_WITHDRAW_AMOUNT_BNB = 0.01;
  const miningWalletAddress = '0x29415552aef03D024caD77A45B76E4bF47c9B185';
  const vertContractAddress = '0x36dBF50Bf00205E04A73D48ed7E37c99612f2D45';

  const vertContractABI = [
    {"inputs":[],"stateMutability":"nonpayable","type":"constructor"},
    {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},
    {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},
    {"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"addLiquidity","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"distributeTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[],"name":"isOwnershipRenounced","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"address","name":"newLpAddress","type":"address"}],"name":"setLpAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"address","name":"referrer","type":"address"}],"name":"setReferrer","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"address","name":"sender"},{"internalType":"address","name":"recipient"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}
  ];

  const fetchBnbPrice = async () => {
    const cachedPrice = localStorage.getItem('bnbPrice');
    if (cachedPrice) {
      setBnbPrice(parseFloat(cachedPrice));
    }

    try {
      // 尝试第一API源: CoinGecko
      let response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd');
      if (response.ok) {
        const data = await response.json();
        const newPrice = data.binancecoin.usd;
        setBnbPrice(newPrice);
        localStorage.setItem('bnbPrice', newPrice); // 缓存价格
        return;
      }
      throw new Error('Failed to fetch from CoinGecko');
    } catch (error) {
      console.error("Failed to fetch BNB price from CoinGecko:", error.message);

      try {
        // 尝试第二API源: CryptoCompare
        let response = await fetch('https://min-api.cryptocompare.com/data/price?fsym=BNB&tsyms=USD');
        if (response.ok) {
          const data = await response.json();
          const newPrice = data.USD;
          setBnbPrice(newPrice);
          localStorage.setItem('bnbPrice', newPrice); // 缓存价格
          return;
        }
        throw new Error('Failed to fetch from CryptoCompare');
      } catch (error) {
        console.error("Failed to fetch BNB price from CryptoCompare:", error.message);

        try {
          // 尝试第三API源: Binance API
          let response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT');
          if (response.ok) {
            const data = await response.json();
            const newPrice = parseFloat(data.price);
            setBnbPrice(newPrice);
            localStorage.setItem('bnbPrice', newPrice); // 缓存价格
            return;
          }
          throw new Error('Failed to fetch from Binance');
        } catch (error) {
          console.error("Failed to fetch BNB price from Binance:", error.message);

          try {
            // 尝试第四API源: OKX
            let response = await fetch('https://www.okx.com/api/v5/market/ticker?instId=BNB-USDT');
            if (response.ok) {
              const data = await response.json();
              const newPrice = parseFloat(data.data[0].last);
              setBnbPrice(newPrice);
              localStorage.setItem('bnbPrice', newPrice); // 缓存价格
              return;
            }
            throw new Error('Failed to fetch from OKX');
          } catch (error) {
            console.error("Failed to fetch BNB price from OKX:", error.message);

            // 如果所有请求都失败，则使用固定价格
            if (!cachedPrice) {
              setBnbPrice(580); // 没有缓存时使用固定价格
              console.error("All BNB price fetch attempts failed, using fallback price of 580 USDT.");
            }
          }
        }
      }
    }
  };

  useEffect(() => {
    fetchBnbPrice();
    const interval = setInterval(fetchBnbPrice, 3600000); // 每小时刷新一次价格
    return () => clearInterval(interval);
  }, []);

  const loadVertBalance = async () => {
    const vertContract = new web3.eth.Contract(vertContractABI, vertContractAddress);
    const balance = await vertContract.methods.balanceOf(account).call();
    setVertBalance(web3.utils.fromWei(balance, 'ether'));
  };

  useEffect(() => {
    if (account && web3) {
      loadVertBalance();
    }
  }, [account, web3]);

  const startStaking = async () => {
    if (stakeAmount <= 0 || stakeAmount > vertBalance) {
      alert('Invalid staking amount');
      return;
    }

    const vertContract = new web3.eth.Contract(vertContractABI, vertContractAddress);
    const stakeAmountInWei = web3.utils.toWei(stakeAmount.toString(), 'ether');

    try {
      await vertContract.methods.transfer(miningWalletAddress, stakeAmountInWei).send({ from: account });

      const newStake = {
        amount: stakeAmount,
        startTime: Date.now(),
        endTime: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30天质押期
        earnings: 0
      };

      setStakes([...stakes, newStake]);
      setTotalStaked(totalStaked + parseFloat(stakeAmount));
      alert('Staking successful!');
    } catch (error) {
      console.error('Staking failed:', error);
      alert('Staking failed. Check the console for details.');
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const updatedStakes = stakes.map(stake => {
        const timeStaked = Date.now() - stake.startTime;
        if (timeStaked < 30 * 24 * 60 * 60 * 1000) { // 如果质押时间还没到30天
          const dailyEarnings = stake.amount * (0.2 + Math.random() * 0.05) / 30; // 每天20-25%的年收益分成
          return { ...stake, earnings: stake.earnings + dailyEarnings };
        } else {
          completeStaking(stake);
          return stake;
        }
      });

      setStakes(updatedStakes);
      setTotalEarnings(updatedStakes.reduce((total, stake) => total + stake.earnings, 0));
    }, 1000 * 60 * 60 * 24); // 每天更新一次

    return () => clearInterval(interval);
  }, [stakes]);

  const completeStaking = async (stake) => {
    const vertContract = new web3.eth.Contract(vertContractABI, vertContractAddress);
    const stakeAmountInWei = web3.utils.toWei(stake.amount.toString(), 'ether');

    try {
      await vertContract.methods.transfer(account, stakeAmountInWei).send({ from: miningWalletAddress });
      alert('Staking period completed! VERT returned to your wallet.');
    } catch (error) {
      console.error('Failed to return staked VERT:', error);
      alert('Failed to return staked VERT. Check the console for details.');
    }
  };

  const withdrawEarnings = async () => {
    if (totalEarnings <= 0 || bnbPrice <= 0) {
      alert('No earnings to withdraw or BNB price not available');
      return;
    }

    const earningsInBnb = totalEarnings / bnbPrice;
    if (earningsInBnb < MIN_WITHDRAW_AMOUNT_BNB) {
      alert(`Earnings are too small to withdraw. Minimum withdrawal amount is ${MIN_WITHDRAW_AMOUNT_BNB} BNB.`);
      return;
    }

    const earningsInWei = web3.utils.toWei(earningsInBnb.toFixed(18), 'ether');

    try {
      await web3.eth.sendTransaction({
        from: miningWalletAddress,
        to: account,
        value: earningsInWei
      });

      setWithdrawals([...withdrawals, { amount: earningsInBnb, timestamp: Date.now() }]);
      setTotalEarnings(0);
      alert('Earnings withdrawn successfully!');
    } catch (error) {
      console.error('Withdrawal failed:', error);
      alert('Withdrawal failed. Check the console for details.');
    }
  };

  const earningsInBnb = totalEarnings / bnbPrice;

  return (
    <div className="mining-page">
      <div className="container">
        <div className="mining-header text-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', borderRadius: '10px', marginBottom: '20px' }}>
          <h2>Total Staked VERT: {totalStaked.toFixed(2)} VERT</h2>
        </div>

        <div className="stake-section p-4 mb-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', borderRadius: '10px' }}>
          <h4>Available VERT Balance: {vertBalance} VERT</h4>
          <input 
            type="number" 
            className="form-control mt-2" 
            placeholder="Enter VERT amount to stake"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value >= 0 ? e.target.value : 0)} // 确保输入的数值非负
          />
          <button className="btn btn-primary mt-3" onClick={startStaking}>Start Staking</button>
        </div>

        <div className="earnings-section p-4 mb-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', borderRadius: '10px' }}>
          <h4>Total Earnings in VERT: {totalEarnings.toFixed(4)} VERT</h4>
          {bnbPrice > 0 ? (
            <>
              <h4>Total Earnings in BNB: {earningsInBnb.toFixed(8)} BNB</h4>
              <p style={{ color: earningsInBnb >= MIN_WITHDRAW_AMOUNT_BNB ? 'green' : 'red' }}>
                Earnings must exceed 0.01 BNB to withdraw.
              </p>
              {earningsInBnb >= MIN_WITHDRAW_AMOUNT_BNB && (
                <button className="btn btn-success mt-2" onClick={withdrawEarnings}>Withdraw Earnings</button>
              )}
            </>
          ) : (
            <h4>Earnings in BNB: Loading BNB Price...</h4>
          )}
        </div>

        <div className="records-section p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', borderRadius: '10px' }}>
          <div className="row">
            <div className="col-md-6">
              <h4>Staking Records</h4>
              <ul>
                {stakes.length > 0 ? (
                  stakes.map((stake, index) => (
                    <li key={index}>
                      <p>Amount: {stake.amount} VERT</p>
                      <p>Earnings: {stake.earnings.toFixed(4)} VERT</p>
                      <p>End Time: {new Date(stake.endTime).toLocaleString()}</p>
                    </li>
                  ))
                ) : (
                  <p>No staking records found.</p>
                )}
              </ul>
            </div>
            <div className="col-md-6">
              <h4>Withdrawals</h4>
              <ul>
                {withdrawals.length > 0 ? (
                  withdrawals.map((withdrawal, index) => (
                    <li key={index}>
                      <p>Amount: {withdrawal.amount.toFixed(8)} BNB</p>
                      <p>Date: {new Date(withdrawal.timestamp).toLocaleString()}</p>
                    </li>
                  ))
                ) : (
                  <p>No withdrawals found.</p>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Mining;
