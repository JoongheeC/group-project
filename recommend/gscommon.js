var commonScriptController = {
	_BG_CLASS_STR : "commonLayerBg",	
	getCommaNumber : function( n ){
         var reg = /(^[+-]?\d+)(\d{3})/;
         n += "";
         while (reg.test(n)) {
            n = n.replace(reg, "$1" + "," + "$2");
         }         
         return n;
	},
	addCommonLayerBg : function( zIndex ){

		if(zIndex == undefined) {
			zIndex = 999;
		}

		var bgObjStr = commonScriptController._BG_CLASS_STR;
		$( "." + bgObjStr ).remove();
		var bgHTML = "<div class=\"" + commonScriptController._BG_CLASS_STR + "\"></div>";
		$("body").append( bgHTML );
		$( "." + bgObjStr ).css( { "width":"100%", "background-color":"#000", "position":"absolute", "z-index":zIndex, "top":"0", "left":"0" } );
		TweenMax.set( $( "." + bgObjStr ), { alpha:0.5 } );
		$( "." + bgObjStr ).hide();		
	},
	showCommonLayerBg : function(){		
		var bgObjStr = commonScriptController._BG_CLASS_STR;
		var screenHeight = $("body").css("height");
		$("body").css("overflow-y", "hidden");
		$( "." + commonScriptController._BG_CLASS_STR ).css( "height", screenHeight );
		$( "." + bgObjStr ).fadeIn("fast");	
	},
	closeCommonLayerBg : function(){
		var bgObjStr = commonScriptController._BG_CLASS_STR;
		$( "." + bgObjStr ).fadeOut();
		$("body").css("overflow-y", "auto");
	},
	showCommonPopup : function( elem, zIndex ){		
		var screenH = (window.innerHeight || self.innerHeight || document.documentElement.clientHeight || document.body.clientHeight);		
		if( parseInt( $(elem).css("height") ) > screenH ){
			var nPos = document.documentElement.scrollTop
			$(elem).css( { "position":"absolute", "left":"50%", "top":nPos + "px", "z-index":zIndex } );			
			$("body").css("overflow-y", "auto");
		}else{
			$(elem).css( { "position":"fixed", "left":"50%", "top":"50%", "z-index":zIndex } );
			$(elem).css( { "margin-top": ( parseInt( $(elem).css("height") ) / 2 * -1 )+ "px" } );
		}		
		$(elem).css( { "margin-left": ( parseInt( $(elem).css("width") ) / 2 * -1 )+ "px" } );

		TweenLite.set($(elem), { scale:0.5, rotationX:70, autoAlpha:0, y:-300, z:-500, transformPerspective:600, display:"block" } );
		TweenLite.to($(elem), 0.25, { autoAlpha:1, scale:1, ease:Back.easeOut.config(1.5), delay:0.1 } );
		TweenLite.to($(elem), 0.4, { rotationX:0, y:0, z:0, ease:Back.easeOut.config(1), delay:0.15, clearProps:"transform" } );
		
		/* 2015-08-18 update - focus오류 수정. */
		$(elem).attr("tabIndex", "-1");
		
		$(document)
			.off('focusin.modalLayer')
			.on('focusin.modalLayer', $.proxy(function (e) {
				if ( elem !== e.target && !$(elem).has(e.target).length) {
					$(elem).trigger("focus");
				}
			}, this));
	},
	closeCommonPopup : function( elem, targetId ){
		TweenLite.set($(elem), {transformPerspective:600});
		TweenLite.to($(elem), 0.3, {rotationX:70, y:-300, z:-500, autoAlpha:0, clearProps:"transform", display:"none", ease:Power1.easeIn});
		
		/* 2015-08-18 update - focus오류 수정. */
		$(document).off('focusin.modalLayer');
		$(elem).attr("tabIndex", "");
		if(targetId != undefined) { 
			targetId.focus();
		}
	},
	isUndefinedFlag : function( obj ){
		var rtn = false;
		if ( obj == undefined ) rtn = true;
		return rtn;
	}
}

var rollingController = function(){
	this._NIDX = 0;
	this._IMG_INFO = {};
	this._RESOURCE = [];
	this._TIMER_ID = null;
	this._DO_CLICK = false;
	this._DIRECTION = 1;
	this._SELECTED_POS = -1;	
	this._PLAY_STATE = false;

	this.setResource = function( img, url, txt ){
		this._RESOURCE.push({ imgInfo:img, hrefInfo:url, alt:txt });
	};
	this.init = function( obj, container, containerW, containerH, width, height, mBtnX, mBtnY, mBtnLeftOutImg, mBtnLeftOverImg, mBtnRightOutImg, mBtnRightOverImg, sBtnX, sBtnY, sBtnOutImg, sBtnOverImg, sBtnPaddingRight, timerConfig ){
		var tInfo = this._IMG_INFO;
		tInfo.objStr 			= obj;
		tInfo.container 		= container;
		tInfo.containerW		= containerW;
		tInfo.containerH		= containerH;
		tInfo.width 			= width;
		tInfo.height 			= height;
		tInfo.mBtnX 			= mBtnX;
		tInfo.mBtnY 			= mBtnY;
		tInfo.mBtnLeftOutImg 	= mBtnLeftOutImg;
		tInfo.mBtnLeftOverImg 	= mBtnLeftOverImg;
		tInfo.mBtnRightOutImg 	= mBtnRightOutImg;
		tInfo.mBtnRightOverImg 	= mBtnRightOverImg;
		tInfo.sBtnX 			= sBtnX;
		tInfo.sBtnY 			= sBtnY;
		tInfo.sBtnOutImg 		= sBtnOutImg;
		tInfo.sBtnOverImg 		= sBtnOverImg;
		tInfo.sBtnPaddingRight	= sBtnPaddingRight;
		tInfo.timerInterval		= -1;

		if( this.getUseTimerFlag( timerConfig ) ){
			var arr_timerConfig 	= timerConfig.split(":");
			tInfo.timerInterval 	= arr_timerConfig[1];
			tInfo.playBtnImgURL 	= arr_timerConfig[2];
			tInfo.stopBtnImgURL 	= arr_timerConfig[3];
			tInfo.controlBtnTopPos 	= arr_timerConfig[4];
			tInfo.controlBtnLeftPos = arr_timerConfig[5];			
			this._PLAY_STATE 		= true;
		}	
		this.setHTML();
	};
	this.setHTML = function(){
		var tHTML = tImgHTML = tIconHTML = tMoveHTML = tPlayHTML = "";
		var tImgTag, tIconTag;
		var tInfo = this._IMG_INFO;
		
		tMoveHTML = "<div class=\"rollingMoveBtnWrap\"><a href=\"#;\"><img src=\"" + tInfo.mBtnLeftOutImg + "\" alt=\"move left\"/></a>";
		tMoveHTML += "<a href=\"#;\"><img src=\"" + tInfo.mBtnRightOutImg + "\" alt=\"move right\"/></a></div>";	
		for( var i=0; i<this._RESOURCE.length; i++ ){
			tImgHTML += "<li>";			
			tImgTag = "<img src=\"" + this._RESOURCE[i].imgInfo + "\" alt=\"" + this._RESOURCE[i].alt + "\" />";
			if( this._RESOURCE[i].hrefInfo != "" ){
				tImgHTML += "<a href=\"" + this._RESOURCE[i].hrefInfo + "\">" + tImgTag + "</a>";
			}else{
				tImgHTML += tImgTag;	
			}
			tImgHTML += "</li>";
			
			( i == 0 ) ? tIconTag = tInfo.sBtnOverImg : tIconTag = tInfo.sBtnOutImg;			
			tIconHTML += "<li><a href=\"#;\"><img src=\"" + tIconTag + "\" alt=\"" + i + "\"/></a></li>";
		}

		tInfo.imgCnt = this._RESOURCE.length;  // set total img cnt
		if( tInfo.timerInterval != -1 ){
			tPlayHTML = "<a href=\"#;\"><img src=\"" + this.getPlayStateImgURL() + "\" alt=\"stop\"/></a>"	
		} 
		
		tHTML = "<div class=\"rollingImgBox\"><ul class=\"rollingImgListWrap\">" + tImgHTML + "</ul></div>" + tPlayHTML + tMoveHTML + "<ul class=\"rollingPositionListWrap\">" + tIconHTML + "</ul>";		
		$(tInfo.container).html( tHTML );
		this.setCSS();		
	};
	this.setCSS = function(){
		var tInfo = this._IMG_INFO;
		$(tInfo.container).css( { "position":"relative", "width": tInfo.containerW + "px", "height": tInfo.containerH + "px" } );
		$(tInfo.container + " .rollingImgBox").css( { "position":"relative", "width": tInfo.width + "px", "height": tInfo.height + "px", "overflow":"hidden", "margin":"0 auto" } )
		$(tInfo.container + " .rollingImgBox .rollingImgListWrap").css( { "width": ( tInfo.width * tInfo.imgCnt ) + "px"} );
		$(tInfo.container + " .rollingImgBox .rollingImgListWrap li").css( "position", "absolute" );
		
		$(tInfo.container + " .rollingMoveBtnWrap a").css( { "position":"absolute", "top":tInfo.mBtnY + "px" } );
		$(tInfo.container + " .rollingMoveBtnWrap a").eq(0).css( "left", tInfo.mBtnX + "px" );
		$(tInfo.container + " .rollingMoveBtnWrap a").eq(1).css( "right", tInfo.mBtnX + "px" );

		$(tInfo.container + " .rollingPositionListWrap").css( { "position":"absolute", "top": tInfo.sBtnX + "px", "left": tInfo.sBtnY + "px" } );
		$(tInfo.container + " .rollingPositionListWrap li").css( { "float":"left", "padding-right": tInfo.sBtnPaddingRight + "px" } );

		// init position
		$(tInfo.container + " .rollingImgBox .rollingImgListWrap li").css( "left", "-50000px" );
		//$(tInfo.container + " .rollingImgBox .rollingImgListWrap li").eq( this._NIDX ).css("left");
		this.setAbsPosition( this._NIDX, 0 );
		this.bindBtnEvent();

		var tThis = this;
		if( tInfo.timerInterval != -1 ){	
			$(tInfo.container + " > a").css( { "position":"absolute", "top":tInfo.controlBtnTopPos + "px", "left":tInfo.controlBtnLeftPos + "px" } );
			$(tInfo.container + " > a").bind("click", function(){ tThis.slideControl() }); 
			this.setTimerConfig();
		}
	};
	this.getPlayStateImgURL = function(){
		var rVal = this._IMG_INFO.playBtnImgURL;
		if( this._PLAY_STATE )	rVal = this._IMG_INFO.stopBtnImgURL;	
		return rVal;
	};
	this.slideControl = function(){
		if( this._PLAY_STATE ){
			clearInterval( this._TIMER_ID );			
		}else{
			this.setTimerConfig();			
		}
		this._PLAY_STATE = !this._PLAY_STATE;
		$( this._IMG_INFO.container + " > a img" ).attr("src", this.getPlayStateImgURL() );
	};
	this.moveClick = function( directionIdx, btnTypeIdx ){
		this._DIRECTION = directionIdx;
		
		if( btnTypeIdx == this._NIDX ) return false;
		
		if(this._IMG_INFO.timerInterval != -1 ){
			this._DO_CLICK = true;
			if( this._PLAY_STATE ) clearInterval( this._TIMER_ID );
		}	

		if( btnTypeIdx != -1 ) this._SELECTED_POS = btnTypeIdx;	

		this.moveSlide( directionIdx );
	};	
	this.moveSlide = function( directionIdx ){
		this.unbindBtnEvent();
		var tInfo = this._IMG_INFO;
		var moveVal = tInfo.width;
		var tMark;
		var nextIdx = this._NIDX + directionIdx;
		nextIdx = this.getValidIdx( nextIdx );
		
		if( this._SELECTED_POS != -1 ){
			nextIdx = this._SELECTED_POS;
			this._SELECTED_POS = -1;
		}

		this.setAbsPosition( nextIdx, directionIdx );

		( directionIdx == 1 ) ? tMark = "-=" : tMark = "+=";

		this.setPositionImgList( nextIdx ); // mark position

		$(tInfo.container + " .rollingImgBox .rollingImgListWrap li").eq(this._NIDX).animate({ left:tMark + moveVal + "px"});
		$(tInfo.container + " .rollingImgBox .rollingImgListWrap li").eq(nextIdx).animate( { left:tMark + moveVal + "px"}, { complete: this.bindBtnEvent() } );

		this._NIDX = nextIdx;
	};
	this.getValidIdx = function( idx ){
		var rIdx = idx;
		
		if(idx == this._IMG_INFO.imgCnt) rIdx = 0;
		if(idx == -1) rIdx = this._IMG_INFO.imgCnt - 1;
		return rIdx;
	};
	this.setPositionImgList = function( directionIdx ){		
		$(this._IMG_INFO.container + " .rollingPositionListWrap li").eq( this._NIDX ).find( "img" ).attr( "src", this._IMG_INFO.sBtnOutImg );
		$(this._IMG_INFO.container + " .rollingPositionListWrap li").eq( this.getValidIdx( directionIdx ) ).find("img").attr( "src", this._IMG_INFO.sBtnOverImg );
	};
	this.bindBtnEvent = function(){
		var setIdx;
		var tThis = this;
		$(tThis._IMG_INFO.container + " .rollingMoveBtnWrap a").eq(0).bind("click", function(){
			tThis.moveClick( -1, -1 ); //right	
		});
		$(tThis._IMG_INFO.container + " .rollingMoveBtnWrap a").eq(1).bind("click", function(){
			tThis.moveClick( 1, -1 );	//left
		});
		for( var i=0; i<tThis._IMG_INFO.imgCnt; i++ ){
			with( { setIdx : i } ){
				$(tThis._IMG_INFO.container + " .rollingPositionListWrap a").eq(setIdx).bind("click", function(){
					tThis.moveClick( tThis._DIRECTION, setIdx );
				});
			}		
		}
		if( tThis._IMG_INFO.timerInterval != -1 && tThis._DO_CLICK ){
			tThis._DO_CLICK = false;
			if ( tThis._PLAY_STATE ) tThis.setTimerConfig();		
		}	
	};
	this.unbindBtnEvent = function(){		
		$(this._IMG_INFO.container + " .rollingMoveBtnWrap a").unbind("click");
		$(this._IMG_INFO.container + " .rollingPositionListWrap a").unbind("click");
	};
	this.setAbsPosition = function( idx, pos ){ // pos : -1, 0 , 1
		var tObj = $(this._IMG_INFO.container + " .rollingImgBox .rollingImgListWrap li").eq(idx);
		var tPos = this._IMG_INFO.width * pos;
		tObj.css( "left", tPos + "px" );
	};
	this.setTimerConfig = function(){		
		//setInterval( _IMG_INFO.objStr + ".moveSlide(" + _DIRECTION + ")", _IMG_INFO.timerInterval * 1000 );
		if ( this._DIRECTION == 1 ) this._TIMER_ID = setInterval( this._IMG_INFO.objStr + ".moveSlide(1)", this._IMG_INFO.timerInterval * 1000 );
		if ( this._DIRECTION == -1 ) this._TIMER_ID = setInterval( this._IMG_INFO.objStr + ".moveSlide(-1)", this._IMG_INFO.timerInterval * 1000 );
	};
	this.getUseTimerFlag = function( timerConfig ){
		var  rVal = false;
		if ( timerConfig.split(":")[0] == "Y" ) rVal = true;		
		return rVal;
	};	
}

var tabClickController = function(){
	this._TABLIST_ELEMENT 	= "";
	this._CONTENTS_ElEMENT 	= "";
	this._TAB_ONCLASS		= "";	
	this.init = function( tabElem, conElem, tabOnClass ){
		this._TABLIST_ELEMENT 	= tabElem;
		this._CONTENTS_ElEMENT 	= conElem;
		this._TAB_ONCLASS		= tabOnClass;
		this.tabEventBinding();
	};
	this.tabEventBinding = function(){
		var tThis = this;
		$( this._TABLIST_ELEMENT ).each(function( index ){
			$(this).bind( "click", function(){
				tThis.viewControl( index );
			});
		});			
	};
	this.viewControl = function( idx ){
		for( var i=0; i<$( this._TABLIST_ELEMENT ).length; i++){
			if ( idx == i ) {
				$( this._CONTENTS_ElEMENT ).eq(i).show();
				$( this._TABLIST_ELEMENT ).eq(i).addClass( this._TAB_ONCLASS );				
			}else{
				$( this._CONTENTS_ElEMENT ).eq(i).hide();
				$( this._TABLIST_ELEMENT ).eq(i).removeClass( this._TAB_ONCLASS );
			}
		}		
	};
}

var GNBController = function(){
	this._NIDX 			= -1;
	this._GNBCONTAINER 	= "";
	this._MENU_MASTER 	= "";
	this._MENU_DETAIL	= "";
	this._GNB_BG		= "";

	this._$GNBFOCUSMENU = "";

	var isActive = false;
	
	this.init = function( gnbContainer, menuMaster, menuDetail, gnbBg ) {
		this._GNBCONTAINER 	= gnbContainer;
		this._MENU_MASTER 	= menuMaster;
		this._MENU_DETAIL	= menuDetail;
		this._GNB_BG		= gnbBg;

		this._$GNBFOCUSMENU = $( this._GNBCONTAINER ).find('a, input, button');
		
		$( this._MENU_DETAIL ).hide();		
		this.BGToggle( false );			
		this.bindEvent();
	};
	this.bindEvent = function() {
		var tThis = this; 
		$( this._MENU_MASTER ).each( function( idx ){
			$(this).bind("focus mouseenter", function(){				
				tThis.showGNB(idx);
			});
		});

		$( this._GNBCONTAINER ).bind("mouseleave", function(){
			$( tThis._MENU_DETAIL ).hide();
			tThis.BGToggle( false );
			tThis._NIDX = -1;
		});

		this._$GNBFOCUSMENU.bind({
			focus : function() {
				isActive = true;
			},
			blur  : function() {
				isActive = false;
				setTimeout(function() {
					if ( isActive === false ) {
						$( tThis._MENU_DETAIL ).hide();
						$( tThis._MENU_MASTER ).removeClass('on');
						tThis.BGToggle( false );
					}
				},150);
			}
		});
	}

	this.showGNB = function(idx) {
		if( this._NIDX != -1) $( this._MENU_DETAIL ).eq( this._NIDX ).hide();
		this.showMotion( idx );
		this._NIDX = idx;		
	};

	this.BGToggle = function( flag ){
		( flag ) ? $( this._GNB_BG ).show() : $( this._GNB_BG ).hide();	
	};
	
	this.showMotion = function( idx ){
		this.unbindEvent();
		var tThis = this;		
		var posNum = 80;
		var setXPos, setYPos;
		$( this._MENU_MASTER ).removeClass('on').eq(idx).addClass('on');
		$( this._MENU_DETAIL ).eq(idx).show();
		$( this._MENU_DETAIL ).eq(idx).find(" > li").each( function( idx ) {			
			var caseVal = Math.floor( 4 * Math.random() );
			switch ( caseVal ) {
				case 0:
					setXPos = -posNum;
					setYPos = 0; 
				break;
				case 1:
					setXPos = posNum;
					setYPos = 0;
				break;
				case 2: 
					setXPos = 0;
					setYPos = -posNum; 
				break;
				case 3:
					setXPos = 0;
					setYPos = posNum;
				break;  
			}			
			TweenMax.set( $(this), { alpha:0, x:setXPos, y:setYPos } );
			TweenMax.to( $(this), 0.6, { alpha:1, y:0, x:0, ease:Power4.easeOut, onComplete: tThis.bindEvent() });			
		});		   
		this.BGToggle( true );		
	};
	this.unbindEvent = function(){
		$( this._MENU_MASTER ).unbind("focus mouseenter");
		$( this._GNBCONTAINER ).unbind("mouseleave");
		this._$GNBFOCUSMENU.unbind("blur");
	};
};

var boardManagerController = function(){	
	this._RESOURCE = [];
	this._DIV_MARK = "@!@"; 
	this._CSRF_TOKEN = "";
	this._PROPERTIES_TEXT = {								// ###### config text
		NOTICE_BOARD 		: "공지사항",		
		OPERATION_DIVISION 	: "",
		REGDATE 			: "등록일. ",
		NODATA_NEXT 		: "다음글이 없습니다.",
		NODATA_PREV 		: "이전글이 없습니다.",
		NEXT_DATA			: "다음글",
		PREV_DATA			: "이전글",
		LIST				: "목록",
		QUESTION			: "질문",
		ANSWER				: "답변",
		PAGING_PREV			: "이전 페이지로 이동",
		PAGING_NEXT			: "다음 페이지로 이동",
		PAGING_BEGIN		: "처음 페이지로 이동",
		PAGING_END			: "마지막 페이지로 이동",
		COUNT_TEXT			: "개",	
		RANK_TEXT			: "위",
		PLAY_TEXT			: "재생하기",
		NO_DATA_MSG			: "등록 된 글이 없습니다."
	};
	this.setNoDataMsg = function( msg ){
		this._PROPERTIES_TEXT.NO_DATA_MSG = msg;
	};
	this._BOARD_INFO = { 									// ###### config boaad
					listCnt 		: 10,  		// default 10
					pageNum  		: 1,
					pagingCnt 		: 10,    	// static count
					formName 		: "boardInfomation",
					searchType		: "",
					searchWord		: "",
					compareDate 	: ""
	};	
	this.setObjStr = function( obj ){	// setter
		this._BOARD_INFO.objStr = obj;
	};	
	this.setTotalCnt = function( cnt ){ // setter
		this._BOARD_INFO.totalCnt = cnt;
	};
	this.setListCnt	= function( cnt ){	// setter
		this._BOARD_INFO.listCnt = cnt;   	///  list cnt re define
	};
	this.setPageNum	= function( page ){ // setter
		this._BOARD_INFO.pageNum = page;   	///  list page re define
	};
	this.setCompareDate = function( date ){
		this._BOARD_INFO.compareDate = date;
	};
	this.setCSRFToken = function( token ){ // setter
		this._CSRF_TOKEN = token;   	///  list page re define
	};	
	this.initList = function( obj, boardName, container, pagingArea, detailUrl ){		
		this._BOARD_INFO.objStr 			= obj;
		this._BOARD_INFO.boardName 			= boardName;
		this._BOARD_INFO.container 			= container;
		this._BOARD_INFO.pagingArea 		= pagingArea;
		this._BOARD_INFO.detailUrl			= detailUrl;		
		this.getList();
	};
	this.initDetail = function( detailId, obj, boardName, detailArea, listUrl ){
		this._BOARD_INFO.detailId 			= detailId;
		this._BOARD_INFO.objStr 			= obj;
		this._BOARD_INFO.boardName 			= boardName;		
		this._BOARD_INFO.detailArea 		= detailArea;
		this._BOARD_INFO.listUrl 			= listUrl;
		this.getDetail();
	};	
	this.getList = function(){		
		var tURL = "/board/boardList";
		var tFormHTML = "";						

		tFormHTML += "<input type=\"hidden\" name=\"pageNum\" id=\"pageNum\" value=\"" + this._BOARD_INFO.pageNum + "\"/>";
		tFormHTML += "<input type=\"hidden\" name=\"pageSize\" id=\"pageSize\" value=\"" + this._BOARD_INFO.listCnt + "\"/>";
		tFormHTML += "<input type=\"hidden\" name=\"modelName\" id=\"modelName\" value=\"" + this._BOARD_INFO.boardName + "\"/>";

		switch( this._BOARD_INFO.boardName ){   	// 타입 별 set data, data mapping
			case "partnershipNotice" :    		// 입점상담 공지사항
			case "newsCnNotice" :
			case "corpNews" :
			case "recruitNotice" :
			case "marketerActivity" :
			case "announcementWinner" ://당첨자발표 
			case "marketerNews" :
			case "gs25StartupYoutube" :
				tFormHTML += "<input type=\"hidden\" name=\"searchType\" id=\"searchType\" value=\"" + this._BOARD_INFO.searchType + "\"/>";
				tFormHTML += "<input type=\"hidden\" name=\"searchWord\" id=\"searchWord\" value=\"" + this._BOARD_INFO.searchWord + "\"/>";
			break;
			case "partnershipFaq" :  // 입점상담 자주하는 질문
				tFormHTML += "<input type=\"hidden\" name=\"searchType\" id=\"searchType\" value=\"all\"/>";
				tFormHTML += "<input type=\"hidden\" name=\"searchWord\" id=\"searchWord\" value=\"" + this._BOARD_INFO.searchWord + "\"/>";
				tFormHTML += "<input type=\"hidden\" name=\"parameterList\" id=\"parameterList\" value=\"bestFlag:N\"/>";
			break;
			case "midnightSnackHero" :  // 야참히어로
                tFormHTML += "<input type=\"hidden\" name=\"searchType\" id=\"searchType\" value=\"" + this._BOARD_INFO.searchType + "\"/>";
                tFormHTML += "<input type=\"hidden\" name=\"searchWord\" id=\"searchWord\" value=\"" + this._BOARD_INFO.searchWord + "\"/>";
                tFormHTML += "<input type=\"hidden\" name=\"parameterList\" id=\"parameterList\" value=\"likeFlag:N\"/>";
            break;
		}		
		this.setFormInformation( tFormHTML );
		this.getData( tURL, this.setResourceList, this );
	};
	this.getDetail = function(){
		var tURL = "/board/boardDetail";
		var tFormHTML = "";						
		switch( this._BOARD_INFO.boardName ){   	// 타입 별 set data, data mapping
			case "partnershipNotice": // 입점상담 공지사항
			case "companyCnNotice" :
			case "newsCnNotice" :
			case "corpNews" :
			case "recruitNotice" :
			case "midnightSnackHero" :
			case "marketerActivity" :
			case "announcementWinner" : //당첨자발표
			case "marketerNews"	:
			case "gs25StartupYoutube" :
				tFormHTML += "<input type=\"hidden\" name=\"articleCode\" value=\"" + this._BOARD_INFO.detailId + "\"/>";
				tFormHTML += "<input type=\"hidden\" name=\"modelName\" value=\"" + this._BOARD_INFO.boardName + "\"/>";
			break;
		}	
		
		this.setFormInformation( tFormHTML );
		this.getData( tURL, this.setResourceDetail, this );		
	};
	this.searchInit = function( selectTypeContorl, inputStrContorl, inputButtonControl ){ // select search type ::: search input control ::: seach btn control ============= include id or class
		this._BOARD_INFO.selectTypeContorl 			= selectTypeContorl;
		this._BOARD_INFO.inputStrContorl 			= inputStrContorl;
		this._BOARD_INFO.inputButtonControl			= inputButtonControl;

		$(this._BOARD_INFO.inputButtonControl).css("cursor", "point");
		var tThis = this;

		$( this._BOARD_INFO.inputButtonControl ).bind("click", function(){
			tThis.searchExecute();
		});
		$( this._BOARD_INFO.inputStrContorl ).bind("keydown", function(event){
			if (event.keyCode==13){
				event.preventDefault();
				tThis.searchExecute();
			}
		});
	};
	this.searchExecute = function(){		
		this._BOARD_INFO.searchType = $.trim($(this._BOARD_INFO.selectTypeContorl).val());
		this._BOARD_INFO.searchWord = xssFilter($.trim($(this._BOARD_INFO.inputStrContorl).val()));
		this._BOARD_INFO.pageNum = 1;	
		
		//Adobe Analytics 2017-05-24 Start
		try{
			var actionNm = "onsite-search";
			var dimensionData = {'search.searchType':this._BOARD_INFO.objStr, 'search.searchTerm':this._BOARD_INFO.searchWord};
			if(this._BOARD_INFO.selectTypeContorl != ""){
				dimensionData['search.filterName'] = this._BOARD_INFO.searchType;
			}	
			_satellite.scTrackEvent(actionNm,'multi-val', JSON.stringify(dimensionData));
		} catch(e) { }					
		//Adobe Analytics 2017-05-24 End
		
		this.getList();
	};
	this.setFormInformation = function( formHTML ){
		$( "#" + this._BOARD_INFO.formName ).remove();
		var tFormHTML = "<form name=\"" + this._BOARD_INFO.formName + "\" id=\"" + this._BOARD_INFO.formName + "\">";
		tFormHTML += formHTML;
		tFormHTML += "</form>";		
		$("body").append( tFormHTML );		
	};
	this.setResourceList = function( result, tThis ){ /////// modify
		var tData = result;
		tThis._RESOURCE = [];
 		switch( tThis._BOARD_INFO.boardName ){   	// 타입 별 set data, data mapping
			case "partnershipNotice" :    		// 입점상담 공지사항
				for( var i=0; i<tData.results.length; i++ ){					
					tThis._RESOURCE.push( { boardCode:tData.results[i].articleCode, title:tData.results[i].subject, regDate:tThis.getDateFormat( tData.results[i].registrationDate, "." ), newFlagTag:tThis.getNewFlagTag(tData.results[i].registrationDate), readCnt:tData.results[i].hits, operationDivision:tData.results[i].operationdivision, memo:tData.results[i].memo } );
				}
				tThis._BOARD_INFO.totalCnt = tData.pagination.totalNumberOfResults;
				tThis.setListHTML();
			break;
			case "partnershipFaq" :    		// 입점상담 자주하는 질문
				for( var i=0; i<tData.results.length; i++ ){					
					tThis._RESOURCE.push( { boardCode:tData.results[i].articleCode, category:tData.results[i].category, title:tData.results[i].subject, memo:tData.results[i].memo } );
				}
				tThis._BOARD_INFO.totalCnt = tData.pagination.totalNumberOfResults;
				tThis.setListHTML();
			break;			
		}		
	};
	this.setResourceDetail = function( result, tThis ){
		var tData = result;
		tThis._RESOURCE = [];
 		switch( tThis._BOARD_INFO.boardName ){   	// 타입 별 set data, data mapping
			case "partnershipNotice" :    		// 입점상담 공지사항, 고객센터 공지사항	
				for( var i=0; i<tData.length; i++ ){
					tThis._RESOURCE.push( { boardCode:tData[i].articleCode, title:tData[i].subject, regDate:tThis.getDateFormat( tData[i].registrationDate, "." ), readCnt:tData[i].hits, operationDivision:tData[i].operationDivision, memo:tData[i].memo,attachFileUrl:tData[i].attachFileUrl, attachFileDsc:tData[i].attachFileDsc, attachFileType:tData[i].attachFileType } );
				}				
			break;
			case "marketerNews" :
				var tPlace;
				for( var i=0; i<tData.length; i++ ){
					tPlace = "";
					if( !commonScriptController.isUndefinedFlag( tData[i].relatePlace ) ){
						tPlace = tData[i].relatePlace.codeLowerCase;
					}	
					tThis._RESOURCE.push( { boardCode:tData[i].articleCode, title:tData[i].subject, regDate:tThis.getDateFormat( tData[i].regiday, "." ), readCnt:tData[i].hits, operationDivision:tPlace, memo:tData[i].memo, attachFileUrl:tData[i].attachFileUrl,  attachFileName:tData[i].attachFileName, attachFileType:tData[i].attachFileType } );					
				}
			break;	
			case "announcementWinner" :
				var tPlace;
				for( var i=0; i<tData.length; i++ ){
					tThis._RESOURCE.push( { boardCode:tData[i].articleCode, title:tData[i].announcementTitle, regDate:tThis.getDateFormat( tData[i].registDate, "." ), memo:tData[i].content } );
				}
			break;
			case "gs25StartupYoutube" :
				var tPlace;
				for( var i=0; i<tData.length; i++ ){
					tPlace = "";
					if( !commonScriptController.isUndefinedFlag( tData[i].relatePlace ) ){
						tPlace = tData[i].relatePlace.codeLowerCase;
					}
					tThis._RESOURCE.push( { boardCode:tData[i].articleCode, title:tData[i].title, regDate:tData[i].regDate, content:tData[i].pcContent } );
				}
			break;

		}
 		tThis.setDetailHTML();
	};
	this.getNewFlagTag = function(date){
		var cDate = this._BOARD_INFO.compareDate;
		tDate = new Date(date);
		if(cDate<tDate.getTime()&&cDate!=""){
			return "<img src=\"/_ui/desktop/common/images/gsretail/common/icon_new.gif\" alt=\"새글\">";
		}else{
			return "";
		}
	};
	this.setListHTML = function(){
		var tInfo = this._BOARD_INFO;
		var tResource = this._RESOURCE;
		var tHTML = "";
		var beginIdx = this.getBeginIndex();		
		switch( tInfo.boardName ){   // 타입 별 set html
			case "partnershipNotice" :    // 입점상담 공지사항	List
				$( tInfo.container + " table tbody" ).html("");
				if( tResource.length == 0 ){
					tHTML = "<tr><td colspan=\"4\">" + this._PROPERTIES_TEXT.NO_DATA_MSG + "</td></tr>";
					$( tInfo.container + " table tbody" ).append( tHTML );
				}else{ 
					for( var i=0; i<tResource.length; i++ ){
						tHTML = "<tr>";
						tHTML += "<td>" + ( beginIdx - i )  + "</td>";
						tHTML += "<td class=\"subj\"><div><a href=\"" + this._BOARD_INFO.detailUrl + "?pageNum=" + this._BOARD_INFO.pageNum + "&amp;articleCode=" + tResource[i].boardCode + "\">" + tResource[i].title + "</a>" + tResource[i].newFlagTag + "</div></td>";
						tHTML += "<td>" + tResource[i].regDate + "</td>";
						tHTML += "<td>" + tResource[i].readCnt + "</td>";
						tHTML += "</tr>";
						$( tInfo.container + " table tbody" ).append( tHTML );					
						var tTitle = $( tInfo.container + " table tbody tr" ).eq(i).find("td div");
						var tTime = 1 * Math.random();					
						TweenMax.set( tTitle, { alpha:0, x:-50 } );
						TweenMax.to( tTitle, tTime, { alpha:1, x:0, ease:Power4.easeOut });
					}
				}
			break;			
		}		
		this.setPagingHTML();
	};
	this.setDetailHTML = function(){ 
		var tHTML = "";
		switch( this._BOARD_INFO.boardName ){   // 타입 별 set html
			case "partnershipNotice" :    // 입점상담 공지사항, 고객센터 공지사항	view			
			case "companyCnNotice" :
			case "newsCnNotice" :
			case "corpNews" :
			case "recruitNotice" :
			case "marketerActivity" :
				tHTML += "<div class=\"tblwrap\">";
				tHTML += "<div class=\"tbl_vtype1\">";
				
				tHTML += "<div class=\"tit_sect\">";
				tHTML += "<h3 class=\"tit\">";
				if ( this._BOARD_INFO.boardName != "marketerNews" && this._BOARD_INFO.boardName != "marketerActivity" && this._BOARD_INFO.boardName != "corpNews"){
					// 요구사항으로 인항 타이틀제목 감춤
					//tHTML += "<span class=\"cate\">&lt;" + this._PROPERTIES_TEXT.NOTICE_BOARD + "&gt;</span>";
				}

				if (this._RESOURCE[1].marker ==undefined){
					tHTML += "<strong>" +this._RESOURCE[1].title + "</strong>";					
				} else {
					tHTML += "<strong>[" + this._RESOURCE[1].marker + "]" +this._RESOURCE[1].title + "</strong>";	
				}
				tHTML += "</h3>";
				tHTML += "<ul class=\"info\">";
				tHTML += "<li class=\"part\">" + this._PROPERTIES_TEXT.OPERATION_DIVISION + this._RESOURCE[1].operationDivision + "</li>";
				tHTML += "<li class=\"date\">" + this._PROPERTIES_TEXT.REGDATE + this._RESOURCE[1].regDate + "</li>";
				tHTML += "</ul>";
				tHTML += "</div>";
				tHTML += "<div class=\"memo\">" + this._RESOURCE[1].memo + "</div>";
				var type;
			
				if ( this._RESOURCE[1].attachFileUrl != null){
					switch(this._RESOURCE[1].attachFileType){
						case "application/pdf" : type="pdf"; break;
						case "application/msword" :type="doc"; break;
						case "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : type="doc"; break;
						case "application/x-hwp" : type="hwp"; break;
						case "application/vnd.openxmlformats-officedocument.presentationml.presentation" :type="ppt"; break;
						case "image/jpeg" : type="img"; break;
						case "image/gif" : type="img"; break;
						case "application/vnd.ms-excel" : type="xls"; break;
						case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : type="xls"; break;
						default : type="img"; break;
					}
					tHTML += "<ul class=\"file\"><li><a href=\""+this._RESOURCE[1].attachFileUrl+"\" class=\""+type+"\">"+this._RESOURCE[1].attachFileDsc+"</a></li>"
				}
/* to do 첨부파일 처리<ul class="file">
						<li><a href="#" class="ppt">2015년 새해 이벤트 안내.ppt</a></li>
						<li><a href="#" class="doc">2015년 새해 이벤트 안내.doc</a></li>
						<li><a href="#" class="hwp">2015년 새해 이벤트 안내.hwp</a></li>
						<li><a href="#" class="pdf">2015년 새해 이벤트 안내.pdf</a></li>
						<li><a href="#" class="img">2015년 새해 이벤트 안내.jpg</a></li>
						<li><a href="#" class="xls">2015년 새해 이벤트 안내.xls</a></li>
					</ul>
 */
				tHTML += "</div>";				
				
				tHTML += "<div class=\"btnwrap rt pt20\">";
				tHTML += "<a href=\"" + this._BOARD_INFO.listUrl + "?pageNum=" + this._BOARD_INFO.pageNum + "\" class=\"btn sty01 onbtn\">" + this._PROPERTIES_TEXT.LIST + "</a>";
				tHTML += "</div>";				

				function getrBlankTitle( tCode, tTitle, tDate, type, tThis ){
					var blankMsg = tThis._PROPERTIES_TEXT.NODATA_NEXT;
					if ( type == "PRE" ) blankMsg = tThis._PROPERTIES_TEXT.NODATA_PREV;					
					if ( tTitle == undefined ){
						return blankMsg;
					}else{
						return "<a href=\"#;\" onclick=\"" + tThis._BOARD_INFO.objStr + ".preNextData('" + tCode + "')\">" + tTitle + "</a><span class=\"date\">" + tDate + "</span>";	
					} 
				}
				
				tHTML += "<div class=\"tbl_nextprev\">";
				tHTML += "	<ul>";				
				tHTML += "		<li class=\"prev\"><span class=\"invisible\">" + this._PROPERTIES_TEXT.NEXT_DATA + "</span>" + getrBlankTitle( this._RESOURCE[2].boardCode, this._RESOURCE[2].title, this._RESOURCE[2].regDate, "NEXT", this ) + "</li>";
				tHTML += "		<li class=\"next\"><span class=\"invisible\">" + this._PROPERTIES_TEXT.PREV_DATA + "</span>" + getrBlankTitle( this._RESOURCE[0].boardCode, this._RESOURCE[0].title, this._RESOURCE[0].regDate, "PRE", this ) + "</li>";
				tHTML += "	</ul>";
				tHTML += "</div>";			
				tHTML += "</div>";
				break;
			case "marketerNews" :
				tHTML += "<div class=\"tblwrap\">";
				tHTML += "<div class=\"tbl_vtype1\">";
				
				tHTML += "<div class=\"tit_sect\">";
				tHTML += "<h3 class=\"tit\">";
				if ( this._BOARD_INFO.boardName != "marketerNews" && this._BOARD_INFO.boardName != "marketerActivity" && this._BOARD_INFO.boardName != "corpNews"){
					// 요구사항으로 인항 타이틀제목 감춤
					//tHTML += "<span class=\"cate\">&lt;" + this._PROPERTIES_TEXT.NOTICE_BOARD + "&gt;</span>";
				}
				tHTML += "<strong>" + this._RESOURCE[1].title + "</strong>";
				tHTML += "</h3>";
				tHTML += "<ul class=\"info\">";
//제거				tHTML += "<li class=\"part\">" + this._PROPERTIES_TEXT.OPERATION_DIVISION + this._RESOURCE[1].operationDivision + "</li>";
				tHTML += "<li class=\"date\">" + this._PROPERTIES_TEXT.REGDATE + this._RESOURCE[1].regDate + "</li>";
				tHTML += "</ul>";
				tHTML += "</div>";
				tHTML += "<div class=\"memo\">" + this._RESOURCE[1].memo + "</div>";
				var type;

				if ( this._RESOURCE[1].attachFileUrl != null){
					switch(this._RESOURCE[1].attachFileType){
						case "application/pdf" : type="pdf"; break;
						case "application/msword" :type="doc"; break;
						case "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : type="doc"; break;
						case "application/x-hwp" : type="hwp"; break;
						case "application/vnd.openxmlformats-officedocument.presentationml.presentation" :type="ppt"; break;
						case "image/jpeg" : type="img"; break;
						case "image/gif" : type="img"; break;
						case "application/vnd.ms-excel" : type="xls"; break;
						case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : type="xls"; break;
						default : type="img"; break;
					}
					tHTML += "<ul class=\"file\"><li><a href=\""+this._RESOURCE[1].attachFileUrl+"\" title=\"다운로드\" download=\""+this._RESOURCE[1].attachFileName+"\" class=\""+type+"\">"+this._RESOURCE[1].attachFileName+"</a></li>"
				}
/* to do 첨부파일 처리<ul class="file">
						<li><a href="#" class="ppt">2015년 새해 이벤트 안내.ppt</a></li>
						<li><a href="#" class="doc">2015년 새해 이벤트 안내.doc</a></li>
						<li><a href="#" class="hwp">2015년 새해 이벤트 안내.hwp</a></li>
						<li><a href="#" class="pdf">2015년 새해 이벤트 안내.pdf</a></li>
						<li><a href="#" class="img">2015년 새해 이벤트 안내.jpg</a></li>
						<li><a href="#" class="xls">2015년 새해 이벤트 안내.xls</a></li>
					</ul>
 */
				tHTML += "</div>";				
				
				tHTML += "<div class=\"btnwrap rt pt20\">";
				tHTML += "<a href=\"" + this._BOARD_INFO.listUrl + "?pageNum=" + this._BOARD_INFO.pageNum + "\" class=\"btn sty01 onbtn\">" + this._PROPERTIES_TEXT.LIST + "</a>";
				tHTML += "</div>";				

				function getrBlankTitle( tCode, tTitle, tDate, type, tThis ){
					var blankMsg = tThis._PROPERTIES_TEXT.NODATA_NEXT;
					if ( type == "PRE" ) blankMsg = tThis._PROPERTIES_TEXT.NODATA_PREV;					
					if ( tTitle == undefined ){
						return blankMsg;
					}else{
						return "<a href=\"#;\" onclick=\"" + tThis._BOARD_INFO.objStr + ".preNextData('" + tCode + "')\">" + tTitle + "</a><span class=\"date\">" + tDate + "</span>";	
					} 
				}
				
				tHTML += "<div class=\"tbl_nextprev\">";
				tHTML += "	<ul>";				
				tHTML += "		<li class=\"prev\"><span class=\"invisible\">" + this._PROPERTIES_TEXT.NEXT_DATA + "</span>" + getrBlankTitle( this._RESOURCE[2].boardCode, this._RESOURCE[2].title, this._RESOURCE[2].regDate, "NEXT", this ) + "</li>";
				tHTML += "		<li class=\"next\"><span class=\"invisible\">" + this._PROPERTIES_TEXT.PREV_DATA + "</span>" + getrBlankTitle( this._RESOURCE[0].boardCode, this._RESOURCE[0].title, this._RESOURCE[0].regDate, "PRE", this ) + "</li>";
				tHTML += "	</ul>";
				tHTML += "</div>";			
				tHTML += "</div>";
			break;
			case "announcementWinner" : //당첨자발표 
				tHTML += "<div class=\"tblwrap\">";
				tHTML += "<div class=\"tbl_vtype1\">";
				
				tHTML += "<div class=\"tit_sect\">";
				tHTML += "<h3 class=\"tit\">";
				if ( this._BOARD_INFO.boardName != "marketerNews" && this._BOARD_INFO.boardName != "marketerActivity" && this._BOARD_INFO.boardName != "corpNews"){
					// 요구사항으로 인항 타이틀제목 감춤
					//tHTML += "<span class=\"cate\">&lt;" + this._PROPERTIES_TEXT.NOTICE_BOARD + "&gt;</span>";
				}
				tHTML += "<strong>" + this._RESOURCE[1].title + "</strong>";
				tHTML += "</h3>";
				tHTML += "<ul class=\"info\">";
				tHTML += "<li class=\"date\">" + this._PROPERTIES_TEXT.REGDATE + this._RESOURCE[1].regDate + "</li>";
				tHTML += "</ul>";
				tHTML += "</div>";
				tHTML += "<div class=\"memo\">" + this._RESOURCE[1].memo + "</div>";
				var type;

				if ( this._RESOURCE[1].attachFileUrl != null){
					switch(this._RESOURCE[1].attachFileType){
						case "application/pdf" : type="pdf"; break;
						case "application/msword" :type="doc"; break;
						case "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : type="doc"; break;
						case "application/x-hwp" : type="hwp"; break;
						case "application/vnd.openxmlformats-officedocument.presentationml.presentation" :type="ppt"; break;
						case "image/jpeg" : type="img"; break;
						case "image/gif" : type="img"; break;
						case "application/vnd.ms-excel" : type="xls"; break;
						case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : type="xls"; break;
						default : type="img"; break;
					}
					tHTML += "<ul class=\"file\"><li><a href=\""+this._RESOURCE[1].attachFileUrl+"\" class=\""+type+"\">"+this._RESOURCE[1].attachFileName+"</a></li>"
				}
				tHTML += "</div>";				
				
				tHTML += "<div class=\"btnwrap rt pt20\">";
				tHTML += "<a href=\"" + this._BOARD_INFO.listUrl + "?pageNum=" + this._BOARD_INFO.pageNum + "\" class=\"btn sty01 onbtn\">" + this._PROPERTIES_TEXT.LIST + "</a>";
				tHTML += "</div>";				

				function getrBlankTitle( tCode, tTitle, tDate, type, tThis ){
					var blankMsg = tThis._PROPERTIES_TEXT.NODATA_NEXT;
					if ( type == "PRE" ) blankMsg = tThis._PROPERTIES_TEXT.NODATA_PREV;					
					if ( tTitle == undefined ){
						return blankMsg;
					}else{
						return "<a href=\"#;\" onclick=\"" + tThis._BOARD_INFO.objStr + ".preNextData('" + tCode + "')\">" + tTitle + "</a><span class=\"date\">" + tDate + "</span>";	
					} 
				}
				
				tHTML += "<div class=\"tbl_nextprev\">";
				tHTML += "	<ul>";				
				tHTML += "		<li class=\"prev\"><span class=\"invisible\">" + this._PROPERTIES_TEXT.NEXT_DATA + "</span>" + getrBlankTitle( this._RESOURCE[2].boardCode, this._RESOURCE[2].title, this._RESOURCE[2].regDate, "NEXT", this ) + "</li>";
				tHTML += "		<li class=\"next\"><span class=\"invisible\">" + this._PROPERTIES_TEXT.PREV_DATA + "</span>" + getrBlankTitle( this._RESOURCE[0].boardCode, this._RESOURCE[0].title, this._RESOURCE[0].regDate, "PRE", this ) + "</li>";
				tHTML += "	</ul>";
				tHTML += "</div>";			
				tHTML += "</div>";
				break;
			case "gs25StartupYoutube" : //창업성공기 상세
				tHTML += "<div class=\"tblwrap\">";
				tHTML += "	<div class=\"tbl_vtype1\">";
				tHTML += "		<div class=\"tit_sect\">";
				tHTML += "			<h3 class=\"tit\"><strong>" + this._RESOURCE[1].title + "</strong></h3>";
				tHTML += "			<ul class=\"info\">";
				tHTML += "				<li class=\"part\">GS25</li><li class=\"date\">등록일. " + this._RESOURCE[1].regDate.replace(/-/g, ".") + "</li>";
				tHTML += "			</ul>";
				tHTML += "		</div>";
				tHTML += "		<div class=\"memo\">"+ this._RESOURCE[1].content + "</div>";
				tHTML += "		<div class=\"btnwrap rt pt20\">";
				tHTML += "			<a href=\"" + this._BOARD_INFO.listUrl + "?pageNum=" + this._BOARD_INFO.pageNum + "\" class=\"btn sty01 onbtn\">" + this._PROPERTIES_TEXT.LIST + "</a>";
				tHTML += "		</div>";

				function getrBlankTitle( tCode, tTitle, tDate, type, tThis ){
					var blankMsg = tThis._PROPERTIES_TEXT.NODATA_NEXT;
					if ( type == "PRE" ) blankMsg = tThis._PROPERTIES_TEXT.NODATA_PREV;
					if ( tTitle == undefined ){
						return blankMsg;
					}else{
						return "<a href=\"#;\" onclick=\"" + tThis._BOARD_INFO.objStr + ".preNextData('" + tCode + "')\">" + tTitle + "</a><span class=\"date\">" + tDate + "</span>";
					}
				}

				tHTML += "		<div class=\"tbl_nextprev\">";
				tHTML += "			<ul>";
				tHTML += "				<li class=\"prev\"><span class=\"invisible\">" + this._PROPERTIES_TEXT.NEXT_DATA + "</span>" + getrBlankTitle( this._RESOURCE[2].boardCode, this._RESOURCE[2].title, this._RESOURCE[2].regDate, "NEXT", this ) + "</li>";
				tHTML += "				<li class=\"next\"><span class=\"invisible\">" + this._PROPERTIES_TEXT.PREV_DATA + "</span>" + getrBlankTitle( this._RESOURCE[0].boardCode, this._RESOURCE[0].title, this._RESOURCE[0].regDate, "PRE", this ) + "</li>";
				tHTML += "			</ul>";
				tHTML += "		</div>";
				tHTML += "	</div>";
				tHTML += "</div>";
				break;
		}
		$(this._BOARD_INFO.detailArea).html(tHTML);
	};
	this.preNextData = function (boardCode) {
		this._BOARD_INFO.detailId = boardCode;
		this.getDetail();
	};
	this.getBeginIndex = function () {  // get begin index
		var tInfo = this._BOARD_INFO;
		return tInfo.totalCnt - (tInfo.listCnt * (tInfo.pageNum - 1));
	};
	this.getData = function (tUrl, continueFnc, continueFncParam) {  // param : pagenum, boardname, listcnt
		// console.log( tUrl + "?" + this.getCSRFToken() + "&amp;" + $("form#" + this._BOARD_INFO.formName ).serialize() );
		$.ajax({
			type: "post",
			url: tUrl + "?" + this.getCSRFToken(),
			data: $("form#" + this._BOARD_INFO.formName).serialize(),
			dataType: "json",
			error: function (request, status, error) {
				// console.log( "code:" + request.status+"\n" + "message:" + request.responseText+"\n" + "error:" + error );
			},
			success: function (result) {
				// console.log( result );
				//console.log( "pagination::::  " + JSON.parse(result).results.pagination.totalNumberOfResults);
				//console.log( JSON.parse(result) );
				continueFnc(JSON.parse(result), continueFncParam);

				/*				try {
                                    console.log("in");
                                }
                                catch (err){
                                    console.log("EERRRRR ::::::::: " + err);
                                }
                                finally {
                                    console.log( result );
                                    continueFnc( JSON.parse(result), continueFncParam );
                                }
                */			}
		});		
	};
	this.moveControl = function( direction ){
		var tPageNum = this._BOARD_INFO.pageNum + direction;
		this.movePage( tPageNum );		
	};
	this.movePage = function( page ){
		this.setPageNum( page );
		this.getList();		
		this.setPagingHTML();
	};		
	this.setPagingHTML = function(){
		var tInfo = this._BOARD_INFO;
		var tHTML = preClass = nextClass = onClass = moveEvent = movePreEvent = moveNextEvent = "";	
		var moveBegin = moveEnd = "";
		if( tInfo.pageNum != 1 ){
			movePreEvent = " onclick=\"" + tInfo.objStr + ".moveControl(-1)\"";
			moveBegin = " onclick=\"" + tInfo.objStr + ".movePage(1)\"";
		}
		tHTML += "<a href=\"#prev2\"" + moveBegin + " title=\"처음 페이지 보기\" class=\"prev2\">" + this._PROPERTIES_TEXT.PAGING_BEGIN + "</a>";
		tHTML += "<a href=\"#prev;\"" + movePreEvent + " title=\"이전 페이지 보기\" class=\"prev" + preClass + "\">" + this._PROPERTIES_TEXT.PAGING_PREV + "</a>";
		tHTML += "<span class=\"num\">";

		var beginNum = this.getPageBeginIdx();
		var endNum = this.getPageEndIdx( beginNum );

		for( var i=beginNum; i<=endNum; i++ ){
			onClass = "";
			moveEvent = "";
			if (i == tInfo.pageNum ){
				onClass = " class=\"on\"";	
			}else{ // event bind				
				moveEvent = " onclick=\"" + tInfo.objStr + ".movePage(" + i + ")\"";
			}

			tHTML += "<a href=\"#;\" title=\"내용보기\"" + onClass + moveEvent +">" + i + "</a>";

			if (i != endNum) {
			    tHTML += " | ";
			}
		}
		tHTML += "</span>";
		if( tInfo.pageNum < this.getPageMaxIdx() ){
			moveNextEvent = " onclick=\"" + tInfo.objStr + ".moveControl(1)\"";
			moveEnd = " onclick=\"" + tInfo.objStr + ".movePage(" + this.getPageMaxIdx() + ")\"";
		}
		tHTML += "<a href=\"#next;\"" + moveNextEvent + " title=\"다음 페이지 보기\" class=\"next" + nextClass + "\">" + this._PROPERTIES_TEXT.PAGING_NEXT + "</a>";
		tHTML += "<a href=\"#next2;\"" + moveEnd + " title=\"마지막 페이지 보기\" class=\"next2\">" + this._PROPERTIES_TEXT.PAGING_END + "</a>";
		$( tInfo.pagingArea ).html( tHTML );	
 	};
 	this.getPageBeginIdx = function(){
 		var tInfo = this._BOARD_INFO;
 		var beginNum = Math.floor( tInfo.pageNum / tInfo.pagingCnt );
 		if( ( tInfo.pageNum % tInfo.pagingCnt ) == 0 ) beginNum = beginNum - 1;
		return ( beginNum * tInfo.pagingCnt ) + 1; 		
 	};
 	this.getPageEndIdx = function( beginIdx ){
 		var tInfo = this._BOARD_INFO;
 		var rIdx = ( beginIdx + tInfo.pagingCnt ) - 1;
 		var totalEndIdx = this.getPageMaxIdx(); 		
 		if( totalEndIdx < rIdx ) rIdx = totalEndIdx;
 		return rIdx;
 	};
 	this.getPageMaxIdx = function(){
 		var tInfo = this._BOARD_INFO;
 		var rIdx = Math.floor( tInfo.totalCnt / tInfo.listCnt );
 		if( tInfo.totalCnt % tInfo.listCnt != 0 ) rIdx = rIdx + 1;
 		return rIdx;
 	};
 	this.getCSRFToken = function(){
 		//return "CSRFToken="+$("#CSRFForm [name='CSRFToken']").val();
 		return "CSRFToken=" + this._CSRF_TOKEN;
 	};
 	this.getDateFormat = function( tDate, formatStr ){
 		var rtn = new Date();
 		
 		try {
 			if(tDate instanceof Date) {
 				rtn = new Date( tDate );
 			} else {
 				if ( tDate.length > 10 ) {
 					rtn = this.getDateObjectFromFullString(tDate);
 				} else if ( tDate.indexOf("-") > -1 ) {
 					var temp    = tDate.split('-');   // 구분자(-)를 기준으로 나눈다
 					rtn = new Date(temp[0], temp[1], temp[2])
 				} else if ( tDate.indexOf(".") > -1 ) {
 					var temp    = tDate.split('.');   // 구분자(-)를 기준으로 나눈다
 					rtn = new Date(temp[0], temp[1], temp[2])
 				} else {
 					if ( tDate.length == 8 ) {
 						rtn = new Date( tDate.substring(0,4), tDate.substring(4,6), tDate.substring(6,8) );
 					}
 				}
 			}
 		} catch(e) {
 			return "";
 		}
 		
 		
 		//var rtn = new Date( tDate );
 		function addZero( str ){
 			if ( String(str).length == 1 ) str = "0" + str; 			
 			return str;
 		};
 		return rtn.getFullYear() + formatStr + addZero( rtn.getMonth() + 1) + formatStr + addZero( rtn.getDate() ); 		
 	};
 	
 	this.getDateFormatYearMonth = function( tDate ){ 		
        var rtn = new Date();
 		
        if ( tDate.length > 10 ) {
        	rtn = this.getDateObjectFromFullString(tDate);
        } else if ( tDate.indexOf("-") > -1 ) {
 			var temp    = tDate.split('-');   // 구분자(-)를 기준으로 나눈다
 			rtn = new Date(temp[0], temp[1], temp[2]);
 		} else if ( tDate.indexOf(".") > -1 ) {
 			var temp    = tDate.split('.');   // 구분자(-)를 기준으로 나눈다
 			rtn = new Date(temp[0], temp[1], temp[2]);
 		} else {
 			if ( tDate.length == 8 ) {
 				rtn = new Date( tDate.substring(0,4), tDate.substring(4,6), tDate.substring(6,8) );
 			}
 		}
 		//var rtn = new Date( tDate );
 		function addZero( str ){
 			if ( String(str).length == 1 ) str = "0" + str; 			
 			return str;
 		};
 		return rtn.getFullYear() + " 년" + addZero( rtn.getMonth() + 1) + " 월"; 		
 	}; 
 	
 	this.getDateObjectFromFullString = function( tDate ) {
 		//Apr 24, 2015 12:00:00 AM
 		var monthArray = {"Jan":0, "Feb":1, "Mar":2, "Apr":3, "May":4, "Jun":5, "Jul":6, "Aug":7, "Sep":8, "Oct":9, "Nov":10, "Dec":11};
 		var temp = tDate.split(' '); // 구분자를 스페이스로 나눈다.
 		var month = monthArray[temp[0]];
 		var day = temp[1].split(',');
 		var year = temp[2];
 		
 		return new Date(year, month, day[0]);
 	};
}

var footerFamilySiteManager = function(){	
	this._FOOTER_RESOURCE = [];           		
	this.init = function(){           			
		this.bindEvent();
		this.setCSS();
	};
	this.setResource = function( wrapLink, wrapUL ){
		this._FOOTER_RESOURCE.push( { wrapLink:wrapLink, wrapUL:wrapUL, showFlag:false } );           			  			
	};
	this.setCSS = function(){
		var tThis = this;
		
		for( var i=0; i<this._FOOTER_RESOURCE.length; i++ ){
			$( this._FOOTER_RESOURCE[ i ].wrapLink + " dd").show();						
			bindCSS( this._FOOTER_RESOURCE[ i ].wrapUL, this._FOOTER_RESOURCE[ i ].wrapLink, i );						
			TweenLite.set( this._FOOTER_RESOURCE[ i ].wrapLink + " ul", { y:this._FOOTER_RESOURCE[ i ].movePX * -1 } );						
		} 
		
		function bindCSS( toObj, fromObj, idx ){
			var tHeight = parseInt( $( fromObj + " ul" ).css("top") ) - 1;
			tThis._FOOTER_RESOURCE[ idx ].movePX = tHeight; 

			$( toObj ).css( "overflow", "hidden" );
			$( toObj ).css( "width", parseInt( $( fromObj + " ul" ).css("width") ) + 2 + "px" );
			$( toObj ).css( "height", parseInt( $( fromObj + " ul" ).css("top") ) * -1 + "px" );					
			$( toObj ).css( "position", "absolute" );
			$( toObj ).css( "left", "-1px" );					
			$( toObj ).css( "top", tHeight + "px" );
			$( fromObj + " ul" ).css( "top", "1px" );
			$( fromObj + " ul" ).css( "left", "0" );						
			$( toObj ).css( "display", "none" );
		}
	};
	this.bindEvent = function(){
		tThis = this;            			
		for( var i=0; i<this._FOOTER_RESOURCE.length; i++ ){						
			with( { setIdx : i } ){
	   			$( this._FOOTER_RESOURCE[ setIdx ].wrapLink + " dt a").bind("click", function(){
	   				tThis.toggleBar( setIdx );
	   			});							
			}
		}				
	};
	this.toggleBar = function( idx ){
		var _sec = 0.6;           			
		var elem = this._FOOTER_RESOURCE[ idx ].wrapLink + " ul";
		var elemBtn = this._FOOTER_RESOURCE[ idx ].wrapLink + " dt";
		if( this._FOOTER_RESOURCE[ idx ].showFlag ){
			TweenLite.to( $(elem), _sec, { y:this._FOOTER_RESOURCE[ idx ].movePX * -1.1, ease:Power4.easeOut, onComplete:this.toggleComplete, onCompleteParams:[ this._FOOTER_RESOURCE[ idx ].wrapUL ] } );
			$(elemBtn).removeClass("off");
		}else{
			$( this._FOOTER_RESOURCE[ idx ].wrapUL ).show();
			TweenLite.to( $(elem), _sec, { y:0, ease:Power4.easeOut } );
			$(elemBtn).addClass("off");
		}
		this._FOOTER_RESOURCE[ idx ].showFlag = !this._FOOTER_RESOURCE[ idx ].showFlag;
	};
	this.toggleComplete = function( elem ){
		$(elem).css("display", "none");
	};
}	


var businessInformationButtonClickController = function(){
	$('.toggle-menu').jPushMenu();
/*	$('.gnbwrap .gnb li a').mouseover(function(){
		$('div.mlbwrap .mlb .' + this.id + 'Sub').show();
		$('div.mlbwrap .mlb').find('ul').not('.' + this.id + 'Sub').hide();
		$('.mlbwrap .mlb').slideDown();
	});
	
	$('div.topwrap').mouseleave(function(){
		$('.mlbwrap .mlb').slideUp();
	});
	
	$('div.brdwrap').mouseover(function(){
		$('.mlbwrap .mlb').slideUp();
	});*/
} 

var xssFilter = function(value) {
	value = value.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    value = value.replaceAll("\\(", "&#40;").replaceAll("\\)", "&#41;");
    value = value.replaceAll("'", "&#39;");
    value = value.replaceAll("eval\\((.*)\\)", "");
    value = value.replaceAll("[\\\"\\\'][\\s]*javascript:(.*)[\\\"\\\']", "\"\"");
    value = value.replaceAll("script", "");
    return value;
}
