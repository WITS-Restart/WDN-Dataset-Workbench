const fs = require("fs");
const {parse} = require("csv-parse");
const {Web3} = require('web3')
const configuration = require('../build/contracts/DifferentialContract.json');
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));
const contract = new web3.eth.Contract(configuration.abi);
const {performance} = require('perf_hooks');

const DifferentialContract = require('../build/contracts/DifferentialContract.json');

nodes = {};
contractsTime = [];
supplierGas = [];
supplierCosts = [];
supplierTimes = [];

async function addTxStats(res1, gasList, costsList) {
    const receipt = await web3.eth.getTransactionReceipt(res1['transactionHash']);
    const gasUsed = receipt['gasUsed'];
    const gasPrice = await web3.eth.getGasPrice();
    const ethUsed = web3.utils.fromWei((gasUsed * gasPrice), 'ether');
    // console.log(`used: ${gasUsed}, ${gasPrice}, ${ethUsed}`);
    gasList.push(gasUsed);
    costsList.push(ethUsed);
}

fs.createReadStream("../../networks/dataset-network-out/NET_3/h_24/NET_3_bd_0_01_h_24_leak_area_0_nodes.csv")
    .pipe(parse({delimiter: ";", from_line: 2}))
    .on("data", function (row) {
        // hour,nodeID,base_demand,demand_value,head_value,pressure_value,x_pos,y_pos,node_type,has_leak,leak_area_value,leak_discharge_value,leak_demand_value
        const hour = row[0];
        const nodeID = row[1];
        const baseDemand = parseInt(row[2] * 100000000);
        const demandValue = parseInt(row[3] * 100000000);
        if (nodes[nodeID] === undefined) {
            nodes[nodeID] = {
                waterSupplier: undefined,
                account: undefined,
                contractAddress: undefined,
                gas: [],
                costs: [],
                data: [],
                times: []
            }
        }
        nodes[nodeID]['data'].push([hour, baseDemand, demandValue]);

    }).on('end', function () {
    const RunAll = async () => {


        //do something with csvData
        let accountCount = 0;
        for (const [key, value] of Object.entries(nodes)) {
            const Main = async () => {
                try {
                    accountArray = await web3.eth.getAccounts();
                    // console.log(accountArray);

                    const waterSupplier = accountArray[99];
                    const account = accountArray[accountCount];
                    nodes[key]['waterSupplier'] = waterSupplier;
                    nodes[key]['account'] = account;

                    if (nodes[key]['contractAddress'] === undefined) {
                        console.log(`---------Creating Contract ${key}-----${account}---------`)
                        const start = performance.now();
                        const deployedContract = await contract.deploy({
                            data: DifferentialContract.bytecode, arguments: [0]
                        }).send({
                            from: account, gas: 2000000, gasPrice: await web3.eth.getGasPrice()
                        });
                        const end = performance.now();
                        const timepassed = end - start;
                        contractsTime.push(timepassed);

                        console.log(deployedContract.options.address);

                        nodes[key]['contractAddress'] = deployedContract.options.address;
                    }

                    const contractAddress = nodes[key]['contractAddress'];
                    const myContractInstance = new web3.eth.Contract(DifferentialContract.abi, contractAddress);

                    for (const datum of nodes[key]['data']) {
                        // console.log('row: ' + datum);

                        let start = performance.now();
                        let res = await myContractInstance.methods.recordBaseDemand(datum[1]).send({
                            from: account, gas: 2000000, gasPrice: await web3.eth.getGasPrice()
                        });
                        await addTxStats(res, nodes[key]['gas'], nodes[key]['costs']);
                        let end = performance.now();
                        let timepassed = end - start;
                        nodes[key]['times'].push(timepassed);

                        const inContract_baseDemand = await myContractInstance.methods.baseDemand().call();
                        // console.log('baseDemand: ' + inContract_baseDemand);

                        start = performance.now();
                        res = await myContractInstance.methods.recordDemandValue(datum[2]).send({
                            from: waterSupplier, gas: 2000000, gasPrice: await web3.eth.getGasPrice()
                        });
                        await addTxStats(res, supplierGas, supplierCosts);
                        end = performance.now();
                        timepassed = end - start;
                        supplierTimes.push(timepassed);

                        const inContract_demandValue = await myContractInstance.methods.demandValue().call();
                        // console.log('demandValue: ' + inContract_demandValue);

                        const inContract_satisfied = await myContractInstance.methods.satisfied().call();
                        // console.log('satisfied: ' + inContract_satisfied);

                        if (!inContract_satisfied) {
                            console.log("======Not Satisfied=====Sending Refund======")
                            start = performance.now();
                            let send = await web3.eth.sendTransaction({
                                from: waterSupplier,
                                to: contractAddress,
                                value: web3.utils.toWei(0.05, "ether"),
                                gasPrice: await web3.eth.getGasPrice()
                            });
                            end = performance.now();
                            timepassed = end - start;
                            supplierTimes.push(timepassed);
                            supplierCosts.push(0.05);
                            // console.log('send: ' + send);


                            const inContract_balance = await myContractInstance.methods.getBalance().call();
                            const eth_inContract_balance = web3.utils.fromWei(inContract_balance, 'ether');
                            // console.log('balance: ' + eth_inContract_balance);

                            if (eth_inContract_balance > 0) {
                                start = performance.now();
                                let result = await myContractInstance.methods.withdrawFromWalletBalance(account).send({
                                    from: account, gas: 5000000, gasPrice: await web3.eth.getGasPrice()
                                });
                                end = performance.now();
                                timepassed = end - start;
                                supplierTimes.push(timepassed);

                                console.log('ammount transfered? ' + result);
                            }
                        }
                    }
                } catch (err) {
                    console.log(err);
                }
            }
            await Main();
            console.log(`Gas ${key}`);
            console.log(nodes[key]['gas'].toString());
            console.log(`Cost ${key}`);
            console.log(nodes[key]['costs'].toString());
            console.log(`Time ${key}`);
            console.log(nodes[key]['times'].toString());

            try {
                fs.writeFileSync('gas.data', nodes[key]['gas'].toString() + '\n', {flag: 'a+'});
                fs.writeFileSync('cost.data', nodes[key]['costs'].toString() + '\n', {flag: 'a+'});
                fs.writeFileSync('time.data', nodes[key]['times'].toString() + '\n', {flag: 'a+'});
                // file written successfully
            } catch (err) {
                console.error(err);
            }
            accountCount++;
        }

        console.log("Supplier Gas");
        console.log(supplierGas.toString());
        console.log("Supplier Cost");
        console.log(supplierCosts.toString());
        console.log("Supplier Times");
        console.log(supplierTimes.toString());
        console.log("Contracts Times");
        console.log(contractsTime.toString());
        try {
            fs.writeFileSync('s-gas.data', supplierGas.toString() + '\n', {flag: 'a+'});
            fs.writeFileSync('s-cost.data', supplierCosts.toString() + '\n', {flag: 'a+'});
            fs.writeFileSync('s-time.data', supplierTimes.toString() + '\n', {flag: 'a+'});
            fs.writeFileSync('c-time.data', contractsTime.toString() + '\n', {flag: 'a+'});
            // file written successfully
        } catch (err) {
            console.error(err);
        }

    }
    RunAll();
});


