// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface  IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);    
}


contract Staker {

    IERC20 public immutable rewardToken;
    IERC20 public immutable stakeToken;
    uint public immutable reward = 1;

    struct StakeInfo {
        uint amount;
        uint time;
    }
    
    
    mapping(address => StakeInfo) public stakes;  //Map address to stake time
    
    event Stake (uint amount);
    event Withdraw (address owner, uint amount );
    event Claim (address owner, uint amount);


    constructor(address reward_token, address stake_token) {
        rewardToken = IERC20(reward_token);
        stakeToken = IERC20(stake_token);
    }


    function stake(uint amount) external returns (bool) {
        stakeToken.transferFrom(msg.sender, address(this), amount);
        stakes[msg.sender] = StakeInfo(amount, block.timestamp);
        emit Stake(amount);
        return true;
    }

    function claim() external returns(bool result) {
        StakeInfo storage userStake = stakes[msg.sender];
        result=  _claim(userStake.amount, userStake.time);
        userStake.time = block.timestamp;
        
    }


    function _claim(uint stake_amount, uint stake_time ) internal returns(bool result) {
        require(stake_amount > 0, "No stake");
        uint _reward = (block.timestamp - stake_time) * reward * stake_amount;
        
        if(reward > 0) {
            result = rewardToken.transfer(msg.sender, _reward); 
            emit Claim(msg.sender, _reward);
        }

    }
    

    function withdraw() external  {
        StakeInfo storage userStake = stakes[msg.sender];
        IERC20(stakeToken).transfer(msg.sender, userStake.amount);
        _claim(userStake.amount, userStake.time);
        userStake.amount = 0;
        userStake.time = block.timestamp;
        emit Withdraw(msg.sender, userStake.amount);
    }






}