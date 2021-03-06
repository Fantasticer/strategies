/*
策略出处: https://www.botvs.com/strategy/82929
策略名称: 内外盘期货品种实时差价图
策略作者: Zero
策略描述:




参数        默认值            描述
--------  -------------  -------
FSymbol   NYMEX CL 1805  外盘品种
LSymbol   sc1809         内盘品种
USDCNY    6.28           USDNCY
Interval  10             收集周期(秒)
*/

function main() {
    LogReset();
    LogProfitReset();
    SetErrorFilter('初始化');
    var symbolA = '';
    var symbolB = '';
    var eLocal = null;
    var eForeign = null;
    _.each(exchanges, function(e) {
        var isForeign = e.GetName() == "Futures_Esunny";
        var ct = isForeign ? FSymbol : LSymbol;
        if (isForeign) {
            eForeign = e;
        } else {
            eLocal = e;
        }
        Log(e.GetName(), "正在连接", (isForeign ? "外盘" : "内盘"), "交易服务器....");
        while (!e.IO("status")) Sleep(100);
        Log("正在订阅品种", ct);
        var symbol = _C(e.SetContractType, ct);
        var volumeMultiple = isForeign ? symbol.ProductDot : symbol.VolumeMultiple;
        var symbolName = isForeign ? (symbol.CommodityName + symbol.UpperNo) : symbol.InstrumentName;
        Log("订阅成功", "每手乘数:", volumeMultiple, "商品名:", symbolName, symbol);
        e.IO("mode", 0);
    });
    if (eLocal == null || eForeign == null) {
        throw "必须添加一个内盘期货跟一个外盘期货";
    }
    var cfgA = {
        title: {
            text: LSymbol + ' & ' + FSymbol + ' 最新价',
        },
        subtitle: {
            text: '每' + Interval + '秒更新一次',
        },
        xAxis: {
            type: 'datetime'
        },
        series: [{
            name: LSymbol,
            data: [],
        }, {
            name: FSymbol,
            data: [],
        }]
    }
    var cfgB = {
        title: {
            text: '差价图'
        },
        xAxis: {
            type: 'datetime'
        },
        series: [{
            name: LSymbol + ' - ' + FSymbol + ' 差价',
            type: 'line',
            data: [],
        }]
    }

    var cfgC = {
        __isStock: false,
        title: {
            text: 'USDCNY yahoo 汇率'
        },
        xAxis: {
            type: 'datetime'
        },
        series: [{
            name: 'USDCNY',
            type: 'line',
            data: [],
        }]
    };
    var chart = Chart([cfgA, cfgB, cfgC]);
    chart.reset();
    while (true) {
        if ($.IsTrading(LSymbol)) {
            var tickerA = eLocal.GetTicker();
            var tickerB = eForeign.GetTicker();
            if (tickerA && tickerB) {
                var ts = Unix() * 1000;
                chart.add(0, [ts, _N(tickerA.Last, 2)]);
                chart.add(1, [ts, _N(tickerB.Last * USDCNY, 2)]);
                chart.add(2, [ts, _N(tickerA.Last - tickerB.Last * USDCNY, 2)]);
                chart.add(3, [ts, USDCNY]);
            }
        } else {
            LogStatus("不在交易时间内....");
        }
        LogStatus(_D(), "Running...");
        Sleep(Interval * 1000);
    }
}
