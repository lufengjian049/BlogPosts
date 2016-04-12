/*
 *
 *author：taozhang@ctrip.com
 */
define([
        'TicketModel',
        'TicketStore',
        'TicketView',
        'cUtility',
        'cScrollLayer',
        'cGeoService',
        'TicketCommon',
        'UIWarning404',
        'TicketConfig',
        'GUrlUtil',
        'GFormat',
        'GScrollDrag',
        'GBulkLazyLoad',
        'ctm',
        'ubt',
        'cMemberService',
        'CommonStore',
        'TicketCityService',
        'cHybridFacade',
        'cShell'
],
    function (TicketModel,
              TicketStore,
              TicketView,
              cUtility,
              cWidgetTipslayer,
              cGeoService,
              TicketCommon,
              cUIWarning404,
              TicketConfig,
              GUrlUtil,
              GFormat,
              GScrollDrag,
              Bulklazyload,
              ctm,
              ubt,
              cMemberService,
              CommonStore,
              TicketCityService,
              hybridFacade,
              cShell) {
        var guider = require('cGuider'),
            //ubt = require('ubt'),
            resInfoModel = TicketModel.ResourceInfoModel.getInstance(), //资源详细信息Model
            TipWdt = require('cScrollLayer'),
            cTip,       //当前弹窗
            detailStore = TicketStore.TicketDetailStore.getInstance(),                            // 详情页存放的store
            listParamStore = TicketStore.TicketListParamStore.getInstance(),
            detailParamStore = TicketStore.TicketDetailParamStore.getInstance(),                       // 详情页参数store
            globalGeoLocation = TicketStore.TicketGeoLocationStore.getInstance(),                      // 定位数据
            shx2Model = TicketModel.SHXProductListSearchV2Model.getInstance(), //套餐新接口
            actModel = TicketModel.ActivitySearch.getInstance(),
            suggestModel = TicketModel.TicketViewSuggest.getInstance(),
            weatherRealModel = TicketModel.WeatherReal.getInstance(),
            tipFlag = false, isLogin,
            cityService = TicketCityService.getInstance(),
            boxInfoModel = TicketModel.TicketBoxAddInfoModel.getInstance(),
            favorite = TicketConfig.h5.favorite;
        var detailView = TicketView.extend({
            name: 'detail',
            pageid: TicketCommon.pageid("detail"),
            hpageid: TicketCommon.hpageid("detail"),
            // getAppUrl: function () {
            //     return GUrlUtil.schema();
            // },
            render: function () {
                //元素集合
                this.els = {
                    'select': this.$el.find('#c-ticket-select'),                 // 门票选择容器
                    'shx': this.$el.find('#ticket-detail-shx-con'),               // 套餐容器
                    'shxTpl': Lizard.T('c-ticket-shx-temp'),//景酒 老模板
                    'shxTpl2':Lizard.T("c-ticket-shx-temp2"), //景酒 新模板
                    'dialog': Lizard.T('c-ticket-dialog-template'),        // 弹窗
                    'dialogFoot':Lizard.T('c-ticker-dialog-foot-template'),
                    'weatherLayerTpl': Lizard.T('c-ticket-detail-weather-layer'), // 天气弹窗
                    'weatherTip': this.$el.find('#c-ticket-detail-weather'),
                    'detailContainer': this.$el.find('#ticket-detail-con'),
                    'activityContainer': this.$el.find('#ticket-detail-activity-con'), //活动容器
                    'activityContainerUp': this.$el.find('#ticket-detail-activity-up-con'),
                    'activityTpl': Lizard.T('c-ticket-activity-tmp'),
                    'activityTplNew': Lizard.T('c-ticket-activity-new-tmp'),
                    'suggestContainer': this.$el.find('#ticket-detail-suggest-con'),
                    'suggestTpl': Lizard.T('c-ticket-suggest'),
                    'proaddinfodetail': this.$el.find('#ticket_product_addinfodetails'), //产品附加信息
                    'proaddinfodetailTpl': Lizard.T('c-ticket-productaddinfo-temp')
                };
            },
            events: {
                'click .detail-resinfo-trigger': 'showResDetail',                             // 详细信息委派
                'click .ticket_book_click': 'forwardBooking',                      // 预定
                'click .btn_res': 'forwardBooking',                         //详细信息弹层预订
                'click .booking_notice_click_area': 'forwardBookingNotice',          // 预定须知
                'click #li_user_comment': 'forwardComment',          // 用户评论
                'click #c-ticket-img-list': 'forwardPictureList', // 点击头部图片，更多
                'click #ticket-detail-map': 'forwardMap',                               //  地图
                'click #ticket-detail-attr': 'forwardAttr',
                'click #myTry': 'errorHandler',                                        // 错误处理
                'click #cui-grayc': 'errorCallHandler',
                'click #ticket_shx_list': 'jumpToSHX',
                'click .ticket_res_title': 'toggleResContent',
                'click .ticket_suggest_li': 'ticketSuggestClick',
                'click #tck_get_more_ticket': 'getMoreTicketByCid',
                'click .ticket_cancel_btn': 'forwardIndex',
                'click .detail-sbox-dd': 'forwardDetailbox',
                'click .view-more-ress': 'viewMoreRess',
                'click .view-act-detail': 'viewActDetail',
                'click .view-all-act-items': 'forwardActDetail'
            },

            onCreate: function () {
            },
            initParams: function () {
                this.favoriteData = [{
                    "BizType": "TICKET",
                    "ProductType": "",
                    "ProductID": this.datas.id,
                    "FromCityID": this.datas.gscid
                }];
                this.favoriteIds = [];
                this.isFavorite = false;
                detailStore.setAttr({ 'data': this.datas });

                var from = Lizard.P('from') || 'nopage';
                detailParamStore.setAttr({ from: from });
                isLogin = CommonStore.UserStore.getInstance().isLogin();
                this._initParam();
            },
            onShow: function () {
                //没有当前景点信息，提示加载失败
                this.pageManager.setPageName(this.name);
                this.render();
                if (this.datas.nodata) {
                    var network = new cPublic.network({
                        parent: '#ticket-detail-con'
                    });
                    // self = this;
                    network.noSearch(function () {
                        var txt = ['<div class="ticket_info_no">',
                            '暂无相关产品',
                            '</div>',
                            '<div class="btn_book mlr15">',
                            '<a id="tck_get_more_ticket" class="ticket_cancel_btn">查看更多门票</a>',
                            '</div>'].join('');
                        this.$el.find('.loadNosearch-box p').html(txt);
                        this.$el.find('.loadNosearch-box').addClass('ticket-nosearch-info');
                    }.bind(this));
                    this.initParams();
                    this.setHeader();
                    return;
                }

                this.init();
                this.setHeader();
                var city = cityService.getLastGeoCity(),
                    logObj = {
                        viewspotid: this.datas.id,
                        gscid: this.datas.gscid,
                        district: this.datas.district,
                        hash: 'detail'
                    }, yyLogObj = {
                        //viewspotid: this.datas.id,
                        hash: 'detail',
                        to: {
                            cityname: this.datas.product.destcname,
                            gscid: this.datas.gscid,
                            district: this.datas.district,
                        },
                        productname: this.datas.name,
                        productid: this.datas.id
                    };
                if (city && city.id) {
                    logObj.cityidfrom = city.id;
                    yyLogObj.from = {
                        cityname: Lizard.P('from') ? '0' : city.name,
                        cityid: Lizard.P('from') ? 0 : city.id
                    }
                }
                this.traceLog.log(ubt.UBT_URL.DETAIL.YYONLOADE, yyLogObj, ubt.UBT_KEY.DETAIL_PUB, 'json');
                if (Lizard.P('traceid')) {
                    logObj.pretraceid = Lizard.P('traceid');
                    logObj.clickindex = Lizard.P('clickindex');
                    logObj.label = Lizard.P('label');
                    logObj.fromlstpart = Lizard.P('fromlstpart');
                    this.traceLog.log(ubt.UBT_URL.DETAIL.ONLOADE, logObj, ubt.UBT_KEY.DETAIL);
                }
                this.routerAdapter.triggerAppDragAnimation({ ifRegister: true });
                this.scrollDragInit();

                // 预定说明只有一个条目而且条目内又有链接需要处理的
                if (parseInt($('.product_summary').data('count')) === 1) {
                    $('.info_detail a').addClass('link-underline')
                        .on('click', this.openNoticeDetail.bind(this));
                }

            },
            onHide: function () {
                if (this.scrollDrag) {
                    this.scrollDrag.clear();
                }
                shx2Model && shx2Model.abort();
                if (cTip && cTip.hide) {
                    cTip.hide();
                }
                this.lazyLoad && this.lazyLoad.destroy();
            },

            viewMoreRess: function (e) {
                var $tar = $(e.currentTarget);

                this.traceLog.log(ubt.UBT_URL.DETAIL.SHOW_MORE_RESS, {
                    viewspotid: this.datas.id,
                    tkt_group: $tar.attr('data-rfcatid'),
                    hash: 'detail'
                }, ubt.UBT_KEY.DETAIL);
                $tar.hide().closest('dl').children('dd[data-display=hide]').show();

            },

            viewActDetail: function (e) {
                var dataSet = e.currentTarget.dataset, from,
                    url = dataSet.url,
                    idx = dataSet.idx,
                    href = window.location.href,
                    index = href.indexOf('?'),
                    catyid = dataSet.catyid
                from = cUtility.isInApp ? '' : href.substring(0, (index > 0 ? index : href.length));
                url = url + (url.indexOf('?') > 0 ? '&' : '?') + 'from=' + from;
                url += '&ctm_ref=tkt_dl_ttd_tdpl_' + idx;

                this.traceLog.log(ubt.UBT_URL.DETAIL.ACT_FORWARD, {
                    viewspotid: this.datas.id,
                    act_prdcategory: catyid,
                    hash: 'detail'
                }, ubt.UBT_KEY.DETAIL);

                if (cUtility.isInApp) {
                    guider.jump({
                        targetModel: 'app',
                        url: url,
                        title: ''
                    });
                } else {
                    this.cross(url, {
                        targetModel: 2
                    });
                }
            },

            /*
             获取实时天气
             */
            requestDyWeather: function (e) {
                var self = this;

                if (!self.datas.gscid) {
                    return;
                }

                weatherRealModel.setParam('did', self.datas.gscid);
                weatherRealModel.excute(function (data) {
                    data = data.data;
                    if (data.tpe && data.wname) {
                        var htmls;

                        if (self.datas.cmtscore > 0) {
                            htmls = [
                                '<i class="icon_w' + data.wno + '"></i>'
                            ]

                        } else {
                            htmls = [
                                '<div class="weather_tips"><i class="icon_w' + data.wno + '"></i></div>',
                                '<div class="ticket_blue f15">' + data.wname + ' ' + data.tpe + '℃</div>'
                            ]
                        }

                        self.els.weatherTip.html(htmls.join(''));
                        self.els.weatherTip.show();
                    }
                }, function () {
                }, true);
            },
            /*
             当地玩乐
             */
            requestActivity: function () {
                var self = this,
                    hasRess = self.datas.hasRess,
                    alnat = self.datas.alnat,
                    ups = [],//显示在门票之上的玩乐
                    downs = []; //显示在门票下的玩乐
                var p = {
                    //viewid: this.datas.id,
                    stype: 0,
                    sval: this.datas.id,
                    size: 'C_130_130',
                    sort: 6,
                    limit: 20,
                    scid: cityService.getSelectedCity().id
                };


                actModel.setParam(p);

                actModel.excute(function (data) {
                    var catids = data.data.catids;
                    data = data.data.actses;

                    if (data && data.length) {
                        var acts = data, html, href = window.location.href, index = href.indexOf('?'), from, actObj = {}, actGrp = [],
                            i = 0, len = acts.length;

                        for (; i < len; i++) {//按活动类型分组
                            if (!actObj.hasOwnProperty('k' + acts[i].catyid)) {
                                var grp = {
                                    catyname: acts[i].catyname,
                                    catyid: acts[i].catyid,
                                    sales: 0,
                                    items: []
                                };

                                actObj['k' + acts[i].catyid] = grp;
                            }
                            actObj['k' + acts[i].catyid].sales += acts[i].sovl;
                            actObj['k' + acts[i].catyid].items.push(acts[i]);
                        }

                        for (var o in actObj) {//对象转数组
                            if (actObj.hasOwnProperty(o)) {
                                if (actObj[o].catyid === 38) { //一日游按出发地聚合
                                    var tmp = {}, items = actObj[o].items, rect = [], deps = [];
                                    //for(var k = 0; k < items.length; k++) {
                                    //    if(!tmp.hasOwnProperty(items[k].depid)) {
                                    //        tmp[items[k].depid] = [];
                                    //    }
                                    //    tmp[items[k].depid].push(items[k]);
                                    //}
                                    //
                                    ////var scid = cityService.getSelectedCity().id;
                                    //for(var x in tmp) {//聚合好的玩乐产品转成一维数组
                                    //    if(tmp.hasOwnProperty(x)) {
                                    //	//if(scid == tmp[x][0].depid) {//出发城市为最近选择的城市，排在最前面
                                    //	//	rect = tmp[x].concat(rect);
                                    //	//} else {
                                    //		rect = rect.concat(tmp[x]);
                                    //	//}
                                    //
                                    //	deps.push(tmp[x][0].depname);
                                    //    }
                                    //}

                                    for (var i = 0; i < items.length; i++) {
                                        deps.push(items[i].depname);
                                        for (var j = i + 1; j < items.length; j++) {
                                            if (items[i].depid === items[j].depid && j - i == 1) {//相邻产品出发地一样
                                                i++;
                                            } else if (items[i].depid === items[j].depid && j - i > 1) {//非相邻产品出发地一样
                                                var temp = items.splice(j, 1);
                                                items.splice(i + 1, 0, temp[0]);
                                                i++;
                                            }
                                        }
                                    }

                                    actObj[o].items = items;
                                    actObj[o].deps = deps;
                                }
                                actGrp.push(actObj[o]);
                            }
                        }

                        actGrp.sort(function (left, right) {//按销量排序
                            if (left.sales < right.sales) {
                                return 1;
                            } else if (left.sales > right.sales) {
                                return -1;
                            }
                            return 0;
                        });

                        if (actGrp.length === 0) {
                            return;
                        }

                        if (alnat === 'B') {//老排序，新样式
                            html = _.template(self.els.activityTplNew, { actGrp: actGrp });
                            self.els.activityContainer.html(html);
                        } else {
                            //剔除from中的querystring
                            from = cUtility.isInApp ? '' : href.substring(0, (index > 0 ? index : href.length));
                            html = _.template(self.els.activityTpl, {
                                actGrp: actGrp,
                                isInApp: cUtility.isInApp,
                                from: encodeURIComponent(from),
                                hasRess: hasRess
                            });
                            self.els.activityContainer.html(html);
                        }

                        //聚合好的数据存入STORE
                        detailStore.setAttr('actObj', actObj);
                    }
                }, function () {

                }, true);

            },
            /*
             看了又看
             */
            requestTicketSuggest: function () {
                var self = this;
                suggestModel.setParam({
                    vsid: this.datas.id,
                    vid: this.getVid(),
                    limit: 10,
                    imgsize: 'C_280_158'
                });

                suggestModel.excute(function (data) {
                    data = data.data;
                    if (data && data.spots) {
                        var len = data.spots.length, n = len - len % 2,
                            list = data.spots.slice(0, n);

                        //if(list.length > 0) {
                        self.els.suggestContainer.html(_.template(self.els.suggestTpl, {
                            'list': list,
                            'hasMore': !self.datas.product.ress.length && !self.datas.isactpro,
                            'from': encodeURIComponent(window.location.href)
                        }));
                        self.updateLazyLoad();
                        //}

                        var spotids = '';
                        for (var i = 0; i < list.length; i++) {
                            spotids += list[i].id;
                            if (i < list.length - 1) {
                                spotids += ','
                            }
                        }

                        self.traceLog.log(ubt.UBT_URL.DETAIL.SUGGEST_LOAD, {
                            viewspotid: self.datas.id,
                            hash: 'detail',
                            viewspotidlist_recommend: spotids
                        }, ubt.UBT_KEY.DETAIL);
                    }
                }, function () {

                }, this)
            },

            getMoreTicketByCid: function () {
                this._goto(Lizard.appBaseUrl + 'dest/ct-' + (this.datas.product.destcname || 'cityname') + '-' + this.datas.product.destcid + '/s-tickets?target=ticket');
            },

            updateLazyLoad: function () {
                this.lazyLoad.destroy();
                this.lazyLoad = new Bulklazyload(this, {
                    scrollContainer: this.$el.find('.js_scroll-box')[0], //'.js_scroll-box',
                    container: this.els.detailContainer,
                    selector: '',
                    type: '',
                    autoProxy: false,
                    loadingCss: '',
                    attrName: 'data-src',
                    diff: 200
                });
                this.lazyLoad.load();
            },

            ticketSuggestClick: function (e) {
                var tar = $(e.currentTarget),
                    tSpotID = tar.attr('data-id'),
                    self = this;

                self.traceLog.log(ubt.UBT_URL.DETAIL.SUGGEST_CLICK, {
                    viewspotid: self.datas.id,
                    hash: 'detail',
                    viewspotid_recommend: tSpotID
                }, ubt.UBT_KEY.DETAIL);
            },

            // 页面初始化
            init: function () {
                this.lazyLoad = new Bulklazyload(this, {
                    scrollContainer: this.$el.find('.js_scroll-box')[0], //'.js_scroll-box',
                    container: this.els.detailContainer,
                    selector: '',
                    type: '',
                    autoProxy: false,
                    loadingCss: '',
                    attrName: 'data-src',
                    diff: 200
                });
                this.lazyLoad.load();
                this.initParams();
                //this.requestDyWeather();
                if (this.datas.pfrom === '0' || this.datas.pfrom === '1') {
                    if (Lizard.P('target') !== 'activity') {
                        this.requestActivity();
                    }
                    this.requestSHX();
                    this.requestTicketSuggest();
                } else {
                    this.requestProductAddInfo();
                }
            },
            requestProductAddInfo: function () {//产品附加信息(免费景点)

                var proaddinfo = this.datas.product.painfos;
                var viewData;
                if (proaddinfo) {
                    viewData = _.filter(proaddinfo, function (item) {
                        return _.contains(['8', '18', '22', '29', '80', '81', '82'], item.astcode);
                    });
                }
                this.els.proaddinfodetail.html(_.template(this.els.proaddinfodetailTpl, {
                    proaddinfos: viewData || [],
                    productdes: this.datas.product.prodes
                }));
            },
            /*
             根据景点下是否有套餐产品动态创建
             */
            requestSHX: function () {
                var self = this;

                shx2Model.setParam({
                    viewid: this.datas.id,
                    pIndex: 1,
                    pSize: 1
                });

                shx2Model.excute(function (response) {
                    var sdpList = response.data.sdps;
                    if (sdpList && sdpList.length) {
                        var html = _.template(self.els.shxTpl2, sdpList[0]);
                        self.els.shx.html(html);
                    }
                }, function () {
                }, true, this);
            },
            jumpToSHX: function (e) {//跳转到套餐页面
                var dataSet = e.currentTarget.dataset, from,
                    url = dataSet.url;
                if (cUtility.isInApp) {
                    //暂时用jump顶着
                    guider.jump({
                        targetModel: 'app',
                        url: url,
                        title: ''
                    });
                } else {
                    this.cross(url, {
                        targetModel: 2
                    });
                }
            },
            showResDetail: function (e) {
                if (tipFlag === true) {
                    return;
                }
                var tar = $(e.currentTarget).closest('.ticket_res_content'),
                    tarDataSet=tar[0].dataset,
                    resid = tarDataSet.resid,//  tar.attr('data-resid'),
                    index = tarDataSet.index,// tar.attr('data-index'),
                    groupName = tarDataSet.groupname,// tar.attr('data-groupName'),
                    isbox = tarDataSet.isbox,// tar.attr('data-isbox'),
                    self = this, res,
                    footTmpObj={
                      h5Sale:false,appSale:false,onlineSale:false,saleStatus:tarDataSet.issale,
                      iskill:tarDataSet.iskill,killbtntext:tarDataSet.killbtntext
                    };
                tarDataSet.isTip=true;
                var dataArr=[];
                for(var key in tarDataSet){
                  var item="data-"+key+"='"+tarDataSet[key]+"'";
                  dataArr.push(item);
                }
                footTmpObj.attrs=dataArr;

                if (isbox == 'true') {
                    res = this.datas.product.boxs[parseInt(index) - this.datas.product.ress.length];
                    res.ismpref = false;
                    res.retc = 0;
                    res.isbox = true;
                    res.coupamt = 0;
                    res.price = res.bprice;
                } else {
                    res = this.datas.product.ress[index];
                }
                if (res.terminals) {
                    for (var i = 0; i < res.terminals.length; i++) {
                        if (res.terminals[i].tmalid == 5) {
                            footTmpObj.appSale = res.terminals[i].issale;
                        }
                        if (res.terminals[i].tmalid == 7) {
                            footTmpObj.h5Sale = res.terminals[i].issale;
                        }
                        if (res.terminals[i].tmalid == 2) {
                            footTmpObj.onlineSale = res.terminals[i].issale;
                        }
                    }
                }
                var model;
                if (isbox == 'true') {
                    model = boxInfoModel;
                    model.setParam({ "bids": [parseInt(resid)] });
                } else {
                    model = resInfoModel;
                    model.setParam({ "resids": [parseInt(resid)], "comp": 1 });
                }

                tipFlag = true;
                self.showLoading();
                model.excute(function (response) {
                    tipFlag = false;
                    self.hideLoading();
                    if (isbox == 'true') {
                        res.rainfos = response.data.boxs[0].rainfos;
                        res.rainfos.forEach = [].forEach;
                        res.title = res.name;
                        res.ismpref = false;
                        res.retc = 0;
                        res.isbox = true;
                        res.coupamt = 0;
                    } else {
                        res.rainfos = response.data.ress;
                        res.title = groupName + '-' + res.name;
                    }

                    var renderHTML = _.template(self.els.dialog, res);
                    footTmpObj.resid=res.id;
                    footTmpObj.resPayMode=res.paymode;
                    footTmpObj.price=res.price;
                    var footHTML = _.template(self.els.dialogFoot,footTmpObj);
                    cTip = new TipWdt({
                        datamodel: {
                            title: '<div class="cui-text-center">详细信息</div>',
                            btns: footHTML
                        },
                        html: renderHTML,
                        events: {
                            'click .btn_res': $.proxy(self.forwardBooking, self),
                            'click a': function (e) {
                                var tar = e.currentTarget, src;
                                e.preventDefault();
                                src = $(tar).attr('href');
                                if (cUtility.isInApp) {
                                    guider.jump({ targetModel: 'h5', url: src, title: '' });
                                } else {
                                    window.location.href = src;
                                }
                            }
                        }
                    });
                    cTip.show();
                }, function (data) {
                    self.hideLoading();
                    tipFlag = false;
                    self.showToast({
                        datamodel: {
                            content: "加载失败，请稍后再试"
                        }
                    })
                }, true);
            },
            //更多图片跳转
            forwardPictureList: function (e) {
                var self = this;
                this.traceLog.log(ubt.UBT_URL.DETAIL.PIC_CLICK, {
                    viewspotid: this.datas.id,
                    isavailable: this.datas.product.ress.length > 0,
                    hash: 'detail'
                }, ubt.UBT_KEY.DETAIL);
                if (cUtility.isInApp) {
                    self.showLoading();
                    imageModel = TicketModel.ViewSpotImages.getInstance();
                    var smallKey = 'C_300_256',
                        bigKey = 'C_640_360';
                    imageModel.setParam({
                        id: this.datas.id,
                        prdid: this.datas.product.id,
                        imgsizes: [smallKey, bigKey]
                    });
                    imageModel.excute(function (data) {
                        self.hideLoading();
                        if (data && data.data) {
                            var imgList = [];
                            imgs = data.data.imgs;
                            for (var i = 0; i < imgs.length; i++) {
                                var img = imgs[i].imgsizeinfos;
                                var obj = {
                                    imageUrl: "",
                                    imageThumbnailUrl: "",
                                    category: "",
                                    imageTitle: '',
                                    imageDescription: ''
                                }
                                for (var j = 0; j < img.length; j++) {
                                    if (img[j].imgsize == smallKey) {
                                        obj.imageThumbnailUrl = img[j].url;
                                    }
                                    if (img[j].imgsize == bigKey) {
                                        obj.imageUrl = img[j].url;
                                    }
                                }
                                imgList.push(obj);
                            }
                            var shareTitle = self.datas.name + "_携程旅行",
                                text = "我在携程旅行上发现“" + self.datas.name + "”很赞，推荐给你！",
                                linkUrl = "http://m.ctrip.com/webapp/ticket/dest/t" + self.datas.id + ".html",
                                shareData = [
                                    {
                                        shareType: "Copy",
                                        imageUrl: '',
                                        title: shareTitle,
                                        text: '',
                                        linkUrl: linkUrl
                                    },
                                    {
                                        shareType: "Default",
                                        imageUrl: '',
                                        title: shareTitle,
                                        text: text,
                                        linkUrl: linkUrl
                                    }
                                ];

                            hybridShell = require('cHybridShell');
                            hybridShell.Fn('show_photo_broswer').run(imgList, shareData, 0, {
                                isThumbnailModel: true,
                                businessCode: 'TICKET_' + self.hpageid
                            });
                        }
                    }, function () {
                        self.hideLoading();
                    }, true);
                } else {
                    this._goto(Lizard.appBaseUrl + 'picturelist?spotid=' + this.datas.id + '&prdid=' + this.datas.product.id + '&imgs=' + this.datas.imgcount);

                }
                var product = this.datas.product, masterPid;
                masterPid = product.id;
            },
            forwardIndex: function (e) {
                this._goto(Lizard.appBaseUrl + 'index');
            },
            forwardDetailbox: function (e) {
                var ressids = $(e.currentTarget).attr('data-sboxids'),
                    resname = $(e.currentTarget).attr('data-name'),
                    groupid = $(e.currentTarget).attr('data-groupid'),
                    mResid = $(e.currentTarget).attr('data-id');
                this._goto(Lizard.appBaseUrl + 'boxdetail?ressids=' + encodeURIComponent(ressids) + '&groupid=' + groupid + '&spotid=' + this.datas.id + '&name=' + encodeURIComponent(resname) + '&mid=' + mResid);
            },
            forwardActDetail: function (e) {
                var catyid = $(e.currentTarget).attr('data-actid');
                this.traceLog.log(ubt.UBT_URL.DETAIL.ACT_VIEW_MORE, {
                    viewspotid: this.datas.id,
                    act_prdcategory: catyid,
                    hash: 'detail'
                }, ubt.UBT_KEY.DETAIL);
                this._goto(Lizard.appBaseUrl + 'actdetail?actid=' + catyid + '&spotid=' + this.datas.id);
            },
            // 跳转至预订页
            forwardBooking: function (e) {
                var tar = $(e.currentTarget).closest('.ticket_res_content'),
                    resid = tar.attr('data-resid'),
                    isSale = tar.attr('data-isSale'),
                    isTip = tar.attr('data-isTip'),
                    isBox = tar.attr('data-isbox') === 'true' ? 1 : 0,
                    promid = tar.attr('data-promid'),
                    skid = tar.attr('data-skid'),
                    iskill = tar.attr('data-iskill'),
                    url, idx;
                if (isSale !== 'false') {
                    if (cTip && cTip.hide) {
                        cTip.hide();
                    }

                    url = Lizard.appBaseUrl + 'booking?tid=' + resid + '&spotid=' +
                        this.datas.id + '&restype=' + isBox +
                        (promid != '0' ? ('&promid=' + promid) : '');

                    if (iskill === 'true') {
                        url += '&skid=' + skid;
                    }

                    if (isTip == 'true') {
                        url = ctm.buildCtmUrl(url, 'DETAIL_POPBTN')
                    } else {
                        url = ctm.buildCtmUrl(url, 'DETAIL_BTN')
                    }
                    this._goto(url);
                }
            },
            // 跳转至预订须知页
            forwardBookingNotice: function (e) {
                var painfos = this.datas.product.painfos, count = 0,
                    codes = ["10", "16", "31"];
                for (var i = 0; i < painfos.length; i++) {
                    if (painfos[i].astcode && codes.indexOf(painfos[i].astcode) > -1) {
                        count++;
                    }
                }
                if (count > 1) {//有一项以上内容才跳转
                    this._goto(Lizard.appBaseUrl + 'bookingnotice');
                }
            },
            forwardComment: function (e) {
                var type = 0;
                if (e.currentTarget.dataset.cmtscore > 0) {
                    var product = this.datas.product;
                    if (this.datas.pfrom === '0' || this.datas.pfrom === '1') {
                        masterPid = product.id;
                        type = 0;
                    } else {
                        masterPid = this.datas.poid;
                        type = 1;
                    }
                    if (masterPid) {
                        this._goto(Lizard.appBaseUrl + 'dest/t' + this.datas.id + '/p' + masterPid + '/comment.html?mpid=' + masterPid + '&cmtscore=' + this.datas.cmtscore + '&cmtusertotal=' + this.datas.cmtusertotal + '&name=' + this.datas.name + '&type=' + type + '&from=detail');
                    }
                }
            },
            // # def !! 地图计算 Event handler
            forwardMap: function (e) {
                var distance, distLocation, mdlong, mdlat, self = this,
                    dqlong = this.datas.lon,
                    dqlat = this.datas.lat,
                    isdomestic = this.datas.isdomestic,
                    url;
                //处理有当前经纬度逻辑，计算与景点的直线距离
                var getLocation = globalGeoLocation.get();

                if (cUtility.isInApp) {
                    if (getLocation) {
                        var lng = getLocation.lng;
                        var lat = getLocation.lat;
                        distance = GFormat.getDistanceByLngLat(dqlong, dqlat, lng, lat);

                        if (distance >= 1) {
                            distance = '相距' + Math.floor(distance) + 'km';
                        } else if (distance >= 0) {
                            distance = '相距' + Math.floor(distance * 1000) + 'm';
                        } else {
                            distance = '';
                        }
                    }
                    var hybridShell = require('cHybridShell');
                    hybridShell.Fn('show_map').run(this.datas.lat, this.datas.lon, this.datas.name, distance || '');
                    return;
                }
                url = Lizard.appBaseUrl + 'map?name=' + this.datas.name +
                    '&lng=' + this.datas.lon +
                    '&lat=' + this.datas.lat +
                    '&isdomestic=' + isdomestic;
                this.forward(url);
            },
            forwardAttr: function (e) {
                this._goto(Lizard.appBaseUrl + 'jianjie/' + this.datas.id + '.html?gscid=' + this.datas.gscid + '&destname=' + this.datas.product.destcname + '&destcid=' + this.datas.product.destcid);
            },
            toggleResContent: function (e) {
                //$(e.currentTarget).siblings('dd').toggle();
            },
            // # def !! 404请求失败错误处理
            errorHandler: function (e) {
                window.location.reload(true);
            },
            // # def !! 404 phone
            errorCallHandler: function (e) {
                var self = this, curNumber = '4008206666';
                return guider.apply({
                    hybridCallback: function () {
                        e.preventDefault();
                        guider.callPhone({ tel: curNumber });
                        return false;
                    },
                    callback: function () {
                        var href = window.location.href;
                        guider.jump({ tel: curNumber });
                        setTimeout(function () {
                            window.location.reload()
                        }, 800);
                        return true;
                    }
                });
            },
            scrollDragInit: function () {
                this.scrollDrag = new GScrollDrag({
                    boxEl: $("#main"),
                    boxOffset: {
                        h5: 48,
                        hi: 0
                    }
                });
            },
            registerViewBack: function () {
                var self = this;
                if (cUtility.isInApp) {
                    hybridFacade.register({
                        tagname: hybridFacade.METHOD_WEB_VEW_DID_APPEAR,
                        callback: function () {
                            hybridFacade.unregister(hybridFacade.METHOD_WEB_VEW_DID_APPEAR);
                            self.pageid = TicketCommon.pageid("detail");
                            self.hpageid = TicketCommon.hpageid("detail");
                            self.sendUbt && self.sendUbt();
                            self.pageid = 0;
                            self.hpageid = 0;
                        }
                    });
                }
            },
            setHeader: function () {
                var name = this.datas.name || '门票';
                this.headerConfig = {
                    title: name,
                    back: true,
                    view: this,
                    tel: null,
                    events: {
                        returnHandler: this.returnHandler.bind(this) //$.proxy(self.returnHandler, self)
                    }
                };
                if (!this.datas.nodata) {
                    if (cUtility.isInApp) {//app
                        this.headerConfig.right = [
                            {
                                tagname: "favorite",
                                callback: $.proxy(this.favoriteHandler, this)
                            },
                            {
                                tagname: 'share',
                                callback: $.proxy(this.shareHandler, this)
                            }
                        ];
                    } else if (favorite) {//h5
                        this.headerConfig.right = [
                            {
                                tagname: "love",
                                callback: $.proxy(this.favoriteHandler, this)
                            }
                        ];
                    }
                }

                //添加weixin微信分享
                this.initWeixinShare();
                this.header.set(this.headerConfig);
                if (!this.datas.nodata && favorite) {
                    this.initFavorite();
                }

            },
            initFavorite: function () {
                var self = this;
                if (!this.collect) {
                    this.collect = new cPublic.collect();
                }

                if (detailParamStore.getAttr('favorite') == '1' && isLogin && !this.favoriteTip) {//未登录点收藏，从登录页回来直接调用收藏
                    detailParamStore.setAttr('favorite', '');
                    this.favoriteHandler();
                } else if (isLogin) {
                    this.collect.isMyFavorites({
                        QueryList: this.favoriteData,
                        Channel: cUtility.isInApp ? 3 : 2
                    }, function (err, data) {
                        if (err) {

                        } else {
                            var isFavorite = data.result[0];
                            if (isFavorite === true) {
                                self.favoriteIds = data.FavoriteIDs;
                            }
                            self.updateFavorite(isFavorite);
                        }
                    });
                }
            },
            updateFavorite: function (isFavorite) {
                var rightData;
                if (cUtility.isInApp) {
                    rightData = [
                        {
                            tagname: isFavorite ? "favorited" : "favorite",
                            callback: $.proxy(this.favoriteHandler, this)
                        },
                        {
                            tagname: 'share',
                            callback: $.proxy(this.shareHandler, this)
                        }
                    ];
                } else {
                    rightData = [
                        {
                            tagname: isFavorite ? "loved" : "love",
                            callback: $.proxy(this.favoriteHandler, this)
                        }
                    ];
                }
                this.isFavorite = isFavorite;
                this.header.updateHeader('right', rightData);
            },
            goSignin: function () {
                var self = this, flag = false;
                param = 't=1&from=' + encodeURIComponent(GUrlUtil.setQueryString(GUrlUtil.local(), 'favorite', '1'));
                cMemberService.memberLogin({
                    param: param, callback: function (data) {
                        detailParamStore.setAttr('favorite', '');
                        isLogin = CommonStore.UserStore.getInstance().isLogin();
                        if (isLogin) {
                            self.favoriteHandler();
                        }
                    }
                });
            },
            getShareData: function () {
                //var shareTitle = this.datas.name + "_携程旅行",
                var shareTitle = "发现携程上这个产品还不错" + this.datas.name,
                    text = "我在携程旅行上发现“" + this.datas.name + "”很赞，推荐给你！",
                    linkUrl = "https://m.ctrip.com/webapp/ticket/dest/t" + this.datas.id + ".html",
                    imgUrl = this.datas &&
                                    this.datas.imgurls &&
                                    this.datas.imgurls[0] ||
                                    'https://pages.ctrip.com/ticket/bg_share.png';
                var shareData = {
                    inCtripAppShareData: [
                        {
                            shareType: "Copy",
                            imageUrl: imgUrl,
                            title: shareTitle,
                            text: '',
                            linkUrl: linkUrl
                        },
                        {
                            shareType: "Default",
                            imageUrl: imgUrl,
                            title: shareTitle,
                            text: text,
                            linkUrl: linkUrl
                        }
                    ],
                    /**
                     * @icon 分享图标
                     * @href 分享地址
                     * @title 分享标题
                     * @desc 分享描述
                     */
                    inWeixinShareData: {
                        icon: imgUrl,
                        href: linkUrl,
                        title: shareTitle,
                        desc: text
                    }
                };
                return shareData;
            },
            shareHandler: function () {
                //var shareTitle = this.datas.name + "_携程旅行",
                //    text       = "我在携程旅行上发现“" + this.datas.name + "”很赞，推荐给你！",
                //    linkUrl    = "http://m.ctrip.com/webapp/ticket/dest/t" + this.datas.id + ".html",
                //    imgUrl     = this.datas && this.datas.imgurls && this.datas.imgurls[0] || 'https://pages.ctrip.com/ticket/bg_share.png',
                //    shareData  = [
                //        {
                //            shareType: "Copy",
                //            imageUrl: imgUrl,
                //            title: shareTitle,
                //            text: '',
                //            linkUrl: linkUrl
                //        },
                //        {
                //            shareType: "Default",
                //            imageUrl: imgUrl,
                //            title: shareTitle,
                //            text: text,
                //            linkUrl: linkUrl
                //        }
                //    ];

                var shareData = this.getShareData().inCtripAppShareData;
                CtripShare.app_call_custom_share(shareData);
            },
            initWeixinShare: function () {
                var shareData = this.getShareData().inWeixinShareData;
                var isInApp = Lizard.isHybrid || Lizard.isInCtripApp;
                if (!isInApp) {
                    cShell.share.ping()
                        .done(function () {
                            cShell.share(shareData);
                            //alert(shareData)
                        })
                        .fail(function () {
                            //TODO
                            cShell.share(shareData);
                        });
                }
            },
            favoriteHandler: function () {
                if (!isLogin) {
                    detailParamStore.setAttr('favorite', '1');
                    this.goSignin();
                    return;
                }
                if (!this.collect) {
                    return;
                }

                this.traceLog.log(ubt.UBT_URL.DETAIL.FAVORITE, {
                    viewspotid: this.datas.id,
                    hash: 'detail'
                }, ubt.UBT_KEY.DETAIL);

                var self = this;
                if (this.isFavorite) {
                    this.collect.cancel(this.favoriteIds, function (err, data) {
                        if (err) {
                            self.showToast({
                                datamodel: {
                                    content: '取消收藏失败，请稍后再试'
                                }
                            })
                        } else {
                            self.favoriteIds = [];
                            self.updateFavorite(false);
                        }
                    })
                } else {
                    this.collect.save({
                        FavoriteList: this.favoriteData,
                        Channel: cUtility.isInApp ? 3 : 2
                    }, function (err, data) {
                        if (err) {
                            self.showToast({
                                datamodel: {
                                    content: '收藏失败，请稍后再试'
                                }
                            })
                        } else {
                            self.favoriteIds = data.FavoriteIDs;
                            self.updateFavorite(true);
                        }
                    });
                }
            },
            //获取ubt vid， 这个以后可能以后取不到，暂时这样处理
            //分别从cookie和localStorage读取
            getVid: function () {
                var vid = '';
                var bfa = this.readCookie('_bfa');
                if (localStorage.CTRIP_UBT_M) {
                    vid = JSON.parse(localStorage.CTRIP_UBT_M).vid;
                } else if (bfa) {
                    var temp = bfa.split('.');
                    vid = temp[1] + '.' + temp[2];
                }
                return vid;
            },
            //这里可以考虑把解析的结果存起来，避免每次重复解析
            //目前调用地方不多，暂时不处理
            readCookie: function (name) {
                var c, C, i;
                c = document.cookie.split('; ');
                var cookies = {};

                for (i = c.length - 1; i >= 0; i--) {
                    C = c[i].split('=');
                    cookies[C[0]] = C[1];
                }

                return cookies[name];
            },
            returnHandler: function () {
                var self = this;
                if (cTip && cTip.$el && (cTip.$el.css('display') !== 'none')) {
                    cTip.hide();
                    return;
                }
                if (self._returnHandler()) {
                    return;
                }
                var from = (detailParamStore.getAttr('from') || Lizard.P('from') || 'nopage').toLowerCase();
                guider.apply({
                    callback: function () {
                        if (from.indexOf('http') === 0 || from.indexOf('/webapp/') === 0) {
                            self.back();
                        } else {
                            self.pageManager.back();
                        }
                    }, hybridCallback: function () {
                        guider.backToLastPage();
                    }
                });
            },
            _goto: function (url, opts) {
                opts = opts || {};
                opts.url = url;
                opts.trigger = true;
                this.registerViewBack();
                //this.historyManager.forward(opts);
                //this.routerAdapter.forward(opts);
                this.pageManager.forward({
                    url: url
                })
            },

            openNoticeDetail: function (e) {
                e.preventDefault();
                e.stopPropagation();

                var self = this;

                var target = e.target,
                    linkAddress = target.href,
                    linkTitle = target.innerText,
                    linkType = linkAddress.match(/\.(\w+)$/);

                if (linkType && linkType[1] === 'pdf') {
                    openPDFLink(linkAddress, linkTitle);
                } else {
                    openCommonLink(linkAddress, linkTitle);
                }

                /**
                 * PDF文件链接跳转
                 */
                function openPDFLink(href, title) {
                    self.showConfirm({
                        datamodel: {
                            content: '该条款将花费大量流量',
                            btns: [
                                { name: '不用啦', className: 'cui-btns-cancel' },
                                { name: '去看看', className: 'cui-btns-ok' }
                            ]
                        },
                        okAction: function () {
                            this.hide();
                            Lizard.isHybrid ? openHrefInWebview(href, title) : window.open(href);
                        },
                        cancelAction: function () {
                            this.hide();
                        }
                    });
                }

                /**
                 * 普通链接跳转
                 */
                function openCommonLink(href, title) {
                    Lizard.isHybrid ? openHrefInWebview(href, title) : window.open(href);
                }

                /**
                 * App中新开WebView打开链接
                 */
                function openHrefInWebview(href, title) {
                    var fn = new cHybridShell.Fn('open_url');
                    fn.run(href, 2, title);
                }
            }
        });
        return detailView;
    });
