//보안 : .ajax post로 controller에서 @RequestBody로 받으려면 반드시 필요
//사용하지 않으면 415 Error발생함
//만약 스크립트내용이 jsp안에 있으면 요청주소에 ?CSRFToken=${CSRFToken}을 추가해주면됨
// -> master.tag에 기본 CSRFForm을 넣어버렸으므로 프론트는 아무데서나 getCSRFToken() 호출하면 붙는다. 
function getCSRFToken(){
	return "CSRFToken="+$("#CSRFForm [name='CSRFToken']").first().val();	
}

function getOnlyCSRFToken(){
	return $("#CSRFForm [name='CSRFToken']").val();	
}

//문자열 공백제거
function trim(str) {
	
	if(str==null) return str;
	
	var count = str.length;
	var len = count;
	var st = 0;

	while ((st < len) && (str.charAt(st) <= ' ')) {
		st++;
	}

	while ((st < len) && (str.charAt(len - 1) <= ' ')) {
		len--;
	}

	return ((st > 0) || (len < count)) ? str.substring(st, len) : str;
}

//쿠키 호출
function getCookieValue(name) {
	var nameOfCookie = name + "=";
	var x = 0;

	while (x <= document.cookie.length) {
		var y = (x + nameOfCookie.length);

		if (document.cookie.substring(x, y) == nameOfCookie) {
			if ((endOfCookie = document.cookie.indexOf(";", y)) == -1) {
				endOfCookie = document.cookie.length;
			}

			return unescape(document.cookie.substring(y, endOfCookie));
		}

		x = document.cookie.indexOf(" ", x) + 1;
		if (x == 0) break;
	}

	return "";
}


//문자열 길이 확인
function checkLen(str) {
	var totalLen, cnt, sUserid, arrUserid, lenOfUserid, lenOfChar;

	sUserid = str;
	arrUserid = sUserid.split("");
	totalLen = sUserid.length;
	lenOfUserid = 0;

	for (cnt = 0; cnt < totalLen; cnt++) {
		lenOfChar = escape(arrUserid[cnt]);
		if (lenOfChar.length == 6) {
			lenOfUserid = lenOfUserid + 2;
		}
		else {
			lenOfUserid = lenOfUserid + 1;
		}
	}
	return lenOfUserid;
}

//문자열 공백 포함여부 확인
function checkBlank(str) {
	for (var n = 0; n < str.length; n++) {
		var thisChar = str.substring(n, n + 1);
		if (thisChar == " ") return true;
	}
	return false;
}

//이메일 형식확인
function checkemail(emailStr) {
	var emailPat = /^(.+)@(.+)$/
		var specialChars = "\\(\\)<>@,;:\\\\\\\"\\.\\[\\]"
			var validChars = "\[^\\s" + specialChars + "\]"
			var quotedUser = "(\"[^\"]*\")"
				var ipDomainPat = /^\[(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\]$/
					var atom = validChars + '+'
					var word = "(" + atom + "|" + quotedUser + ")"
					var userPat = new RegExp("^" + word + "(\\." + word + ")*$")
	var domainPat = new RegExp("^" + atom + "(\\." + atom + ")*$")
	var matchArray = emailStr.match(emailPat)

	if (matchArray == null) return false;

	var user = matchArray[1];
	var domain = matchArray[2];

	if (user.match(userPat) == null) return false;

	var IPArray = domain.match(ipDomainPat);

	if (IPArray != null) {
		for (var i = 1; i <= 4; i++) {
			if (IPArray[i] > 255) return false;
		}
		return true;
	}

	var domainArray = domain.match(domainPat);
	if (domainArray == null) return false;

	var atomPat = new RegExp(atom, "g");
	var domArr = domain.match(atomPat);
	var len = domArr.length;

	if (domArr[domArr.length - 1].length < 2 || domArr[domArr.length - 1].length > 3) return false;
	if (len < 2) return false;

	return true;
}

//전화번호 타당성 확인
function isPhoneNum(v1, v2) {
	var PhoneReg = "02,031,032,033,041,042,043,044,051,052,053,054,055,061,062,063,064,060,080,011,016,017,018,019,010,070,0502,0505,0506,0130,0303"

		if (v1 == "" || v2 == "") {
			return false;
		}

	if (PhoneReg.indexOf(v1) < 0) {
		return false;
	}

	if (v1 == "02") {
		if (v2.length < 9 || v2.length > 10) {
			return false;
		}
	}
	else if ("050,0502,0505,0506,0130,0303".indexOf(v1) > 0) {
		if (v2.length < 11 || v2.length > 12) {
			return false;
		}
	}
	else {
		if (v2.length < 10 || v2.length > 11) {
			return false;
		}
	}
	return true;
}

//숫자형 체크
function isNum(num_Val) {
	
	if(num_Val==null) return true;
	
	var numStr = "0123456789/ ";
	var thisChar;
	var counter = 0;

	for (var n = 0; n < num_Val.length; n++) {
		thisChar = num_Val.substring(n, n + 1);
		if (numStr.indexOf(thisChar) != -1) counter++;
	}

	if (counter == num_Val.length) {
		return true;
	}
	else {
		return false;
	}
}

function getBytes(contents) {
	var character;
	var charCount;
	var contentsLength;

	charCount = 0;
	contentsLength = contents.length;

	for (k = 0; k < contentsLength; k++) {
		character = contents.charAt(k);

		if (escape(character).length > 4) {
			charCount += 2;
		}
		else {
			charCount++;
		}
	}
	return charCount;                    
}

//히든팝업은 깔끔하게 처리가 어려워서 히든iframe으로 대체
//<iframe name="hiddenIframe"></iframe>
function openHiddenPopup(targetUrl){
	// 팝업차단을 체크하기 위해 띄운다.
	var win = window.open('', '',  	'width=1, top=100, left=100, height=1, width=1, scrollbars=yes, resizable=yes');
	if ( typeof(win) == "undefined" ||
		 win == null ||
		 typeof(win.name) == "undefined" ) {
		alert("팝업 차단 기능이 설정되어있습니다\n\n차단 기능을 해제(팝업허용) 한 후 다시 이용해 주십시오.\n\n만약 팝업 차단 기능을 해제하지 않으면\n다음으로 진행하실 수 없습니다");
		 return;
	}else{
		win.close();
		// 기존 iframe이 있으면 삭제 후 생성
		$("#hiddenIframe").remove();
		$("body").append("<iframe name='hiddenIframe' id='hiddenIframe' style='display:none;'></iframe>")	
//		$("body").append("<iframe name='hiddenIframe' id='hiddenIframe' style='display:block;width:100%;height:1000px;'></iframe>")
		$("#hiddenIframe").attr({"src":targetUrl});		
	}
	if ( win ){
		win.close();
	}
}

// 레이어팝업 - 아래형식으로 코딩하고 콜하면된다.
// <div class="popup-outer-layer"><div class="bg"><div class="~~ pop-inner-layer" id="팝업아이디">보여줄팝업</div></div></div>
function openLayerPopup(el, parentId){

	//var bgclickClose = true;
	// jqueryObject by ID
	var temp = $('#' + el);
	var bg = temp.parent().children().hasClass('bg');	//dimmed 레이어를 감지하기 위한 boolean 변수
	temp.attr("tabIndex", "-1");
	$(".pop_scbox", temp).attr("tabIndex", "0");
	temp.show();
	temp.parent().filter(".popup-outer-layer").fadeIn();

	/* 2015-08-14 update - focus오류 수정. */
	$(document)
		.off('focusin.modalLayer')
		.on('focusin.modalLayer', $.proxy(function (e) {
			if ( temp[0] !== e.target && !temp.has(e.target).length) {
				temp.trigger('focus');
			}
		}, this));

	$("body").css("overflow","hidden");
	
	// css스타일에 포지션의 top, left값 및 margin-top, left값 이 지정되있는애들이 있고 0으로 해놓은 애들이 있다.
	// 초기포지션 값이 0인경우 마진을 -로 주는거 자체가 말이안됨
	// -인 경우 적절히 띄워주도록 +값으로 변경했고 가시공간인 window사이즈를 기반으로 재계산함.
	// (css상관없이 적절한 위치에 나오도록 위치/마진값을 전부 0으로 초기화시키고 재계산)  
	temp.css({'top':'0px', 'left':'0px'});
	temp.css({'margin-top':'0px', 'margin-left':'0px'});
	if (temp.height() < $(window).height() ) temp.css('margin-top', ($(window).height()-temp.height())/2+'px');
	else temp.css({'top':'10px', 'margin-top':'10px'});
	if (temp.width() < $(window).width() ) temp.css('margin-left', ($(window).width()-temp.width())/2+'px');
	else temp.css({'left':'10px', 'margin-left':'10px'});
	
	// 닫기버튼 이벤트바인딩
	temp.find('.pop_cls a,.closeLayerPopup,.btn.sty01.gray_dk, .btn.sty02.bk').click(function(e){
		temp.parent().filter('.popup-outer-layer').fadeOut(); //'bg' 클래스가 존재하면 레이어를 사라지게 한다.
		temp.fadeOut();
		$("body").css("overflow","visible");

		/* 2015-08-14 update - focus오류 수정. */
		$(document).off('focusin.modalLayer');
		$(".pop_scbox", temp).attr("tabIndex", "");
		
		if(parentId != undefined) {
			parentId.focus();	
		}
		
		if (e) e.preventDefault();
	});

	//if (bgclickClose){
//				$('.popup-outer-layer .bg').click(function(e){	//배경을 클릭하면 레이어를 사라지게 하는 이벤트 핸들러
//					$('.popup-outer-layer').fadeOut();
//					temp.fadeOut();
//					e.preventDefault();
//				});
	//}
	
	var popInnerLayerHeight = parseInt($(".pop-inner-layer").css("height").replace("px", "")); 
	if ( popInnerLayerHeight > $(window).height()-40){
		$(".pop-inner-layer").css({"height":$(window).height() - 40, "overflow-y":"auto"});
	}

	var popInnerLayerWidth = parseInt($(".pop-inner-layer").css("width").replace("px", "")); 
	if ( popInnerLayerWidth > $(window).height()){
		$(".pop-inner-layer").css({"height":$(window).height() , "overflow-x":"auto"});
	};
	//return false; ie 오류 수정
}

function openLayerComnPopup(el, bgclickClose){
	var bgclickClose = true;
	// jqueryObject by ID
	var temp = $('#' + el);
	var bg = temp.parent().children().hasClass('bg');	//dimmed 레이어를 감지하기 위한 boolean 변수
	temp.show();
	temp.parent().filter(".popup-outer-layer").fadeIn();
	$("body").css("overflow","hidden");
	
	// css스타일에 포지션의 top, left값 및 margin-top, left값 이 지정되있는애들이 있고 0으로 해놓은 애들이 있다.
	// 초기포지션 값이 0인경우 마진을 -로 주는거 자체가 말이안됨
	// -인 경우 적절히 띄워주도록 +값으로 변경했고 가시공간인 window사이즈를 기반으로 재계산함.
	// (css상관없이 적절한 위치에 나오도록 위치/마진값을 전부 0으로 초기화시키고 재계산)  
	temp.css({'top':'0px', 'left':'0px'});
	temp.css({'margin-top':'0px', 'margin-left':'0px'});
	
	$(".pop-inner-layer").width($("#"+el+" .pop_cnt").width());
	
	if (temp.height() < $(window).height() ) temp.css('margin-top', ($(window).height()-temp.height())/2+'px');
	else temp.css({'top':'10px', 'margin-top':'10px'});
	
	if (temp.width() < $(window).width() ) temp.css('margin-left', ($(window).width()-temp.width())/2+'px');
	else temp.css({'left':'10px', 'margin-left':'10px'});

	//팝업위치 조정
	var target = $('#' + el+" div:first-child").attr("id");
	if(target == "TOPLEFT"){
		 temp.css('margin-top','0px');
		 temp.css('margin-left','0px');
	}else if(target == "TOPMIDDLE"){
		temp.css('margin-top','0px');
	}else if(target == "TOPRIGHT"){
		temp.css('margin-top','0px');
		temp.css('right','0px');
		temp.css('left','');
		temp.removeClass("pop-inner-layer");
		temp.css('position','absolute');
	}else if(target == "MIDLEFT"){
		temp.css('margin-left','0px');
	}else if(target == "MIDMIDDLE"){
		// default
	}else if(target == "MIDRIGHT"){
		temp.css('right','0px');
		temp.css('left','');
		temp.removeClass("pop-inner-layer");
		temp.css('position','absolute');
	}else if(target == "BOTTOMLEFT"){
		temp.css('top','');
		temp.css('bottom','0px');
		temp.css('margin-left','0px');
		temp.removeClass("pop-inner-layer");
		temp.css('position','absolute');
	}else if(target == "BOTTOMMIDDLE"){
		temp.css('top','');
		temp.css('bottom','0px');
		temp.removeClass("pop-inner-layer");
		temp.css('position','absolute');
	}else if(target == "BOTTOMRIGHT"){
		temp.css('top','');
		temp.css('bottom','0px');
		temp.css('right','0px');
		temp.css('left','');
		temp.removeClass("pop-inner-layer");
		temp.css('position','absolute');
	}
	
	// 닫기버튼 이벤트바인딩
	temp.find('.pop_term,.pop_cls a,.closeLayerPopup,.btn.sty01.gray_dk').click(function(e){
		temp.parent().filter('.popup-outer-layer').fadeOut(); //'bg' 클래스가 존재하면 레이어를 사라지게 한다.
		temp.fadeOut();
		$("body").css("overflow","visible");
		e.preventDefault();
	});

	var popInnerLayerHeight = parseInt($(".pop-inner-layer").css("height").replace("px", "")); 
	if ( popInnerLayerHeight > $(window).height()-40){
		$(".pop-inner-layer").css({"height":$(window).height() - 40, "overflow-y":"auto"});
	}

	var popInnerLayerWidth = parseInt($(".pop-inner-layer").css("width").replace("px", "")); 
	if ( popInnerLayerWidth > $(window).height()){
		$(".pop-inner-layer").css({"height":$(window).height() , "overflow-x":"auto"});
	}
}

function closeLayerPopup(el, parentId){
	
	$(".popup-outer-layer").fadeOut(); //'bg' 클래스가 존재하면 레이어를 사라지게 한다.
	$("#"+el).fadeOut();
	$("body").css("overflow","visible");	
	
	var temp = $("#"+el);
	/* 2015-08-14 update - focus오류 수정. */
	$(document).off('focusin.modalLayer');
	$(".pop_scbox", temp).attr("tabIndex", "");
	
	if(parentId != undefined) {
		parentId.focus();	
	}
}

function closeAllLayerPopup(){
	$(".popup-outer-layer").fadeOut(); //'bg' 클래스가 존재하면 레이어를 사라지게 한다.
	$(".pop-inner-layer").fadeOut();
	$("body").css("overflow","visible");	
}

// rgb값을 hex로
function rgb2hex(rgb) {
	rgb = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+))?\)$/);
	function hex(x) {
		return ("0" + parseInt(x).toString(16)).slice(-2);
	}
	return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
}

/** 
 * 년월일 select box 만들기 2015-04-22 박규태 추가
 *
 * nowDay = "현재 날짜(2015.04.22)"
 * yearId = "select box year ID"
 * monId = "select box month ID"
 * dayId = "select box day ID"
 * 사용 방법 = $.setSelect("2015.04.22", "openDate1", "openDate2", "openDate3");
**/
$.setSelect = function(nowDay, yearId, monId, dayId) {
	//년월일 초기화
	$("#" + yearId).html('');
	$("#" + monId).html('');
	$("#" + dayId).html('');
	
	//현재 날짜 분리(2015.04.22 로 넘어옴)
	nowDayArr = nowDay.split(".");
	
	var toDay = new Date();
	var year  = toDay.getFullYear();
	var month = (toDay.getMonth()+1);
	var day   = toDay.getDate();
	
	var str = "";
	// 년도 설정
	for (var i=year; i>=1900; i--) {
		
		if (nowDayArr[0] == i) {
			str += "<option value='" + i + "' selected='selected'>" + i + "년</option>";
		} else {
			str += "<option value='" + i + "' >" + i + "년</option>";
		}
	}
	$("#" + yearId).html(str);
	
	// 월, 일 설정
	for (var i=1; i<=31; i++) {
		var val = "";
		if (i < 10) {
			val = "0" + new String(i);
		} else {
			val = new String(i);
		} 
		
		if (nowDayArr[2] == i) {
			$("<option value='" + val + "' selected>" + val + "일</option>").appendTo("#" + dayId);
		} else {
			$("<option value='" + val + "'>" + val + "일</option>").appendTo("#" + dayId);
		}
		
		if (i < 13) {
			if (nowDayArr[1] == i) {
				$("<option value='" + val + "' selected>" + val + "월</option>").appendTo("#" + monId);
			} else {
				$("<option value='" + val + "'>" + val + "월</option>").appendTo("#" + monId);
			}
		}
	}

	// null 일경우 오늘 날짜
	if (nowDay == "null") {
		$("#" + yearId).val(year);
		$("#" + monId).val(month);
		$("#" + dayId).val(day);
	}
};

//날짜 yyyy-MM-dd 형식 변환 2015-04-22 박규태 추가
//tmpDate 는 new Date(tmpDate)형식
$.changeDate = function(tmpDate){
	var year = tmpDate.getFullYear()
	var month = tmpDate.getMonth()+1
	var date = tmpDate.getDate()
	
    return year + "." + $.addzero(month) + "." + $.addzero(date);
};

//시간:분 형식 변환 2015-05-13 박규태 추가
$.changeHHmm = function(tmpDate){
	var hhmm = tmpDate.getHours() + ":" + tmpDate.getMinutes();
	return hhmm
};

//날짜 yyyy-MM-dd 형식 변환 & 첫날 마지막 날 2015-04-22 박규태 추가
$.changeBeginEndDate = function(tmpDate, index){
	var year = tmpDate.getFullYear()
	var month = tmpDate.getMonth()+1
	var date = ""
	if(index == 1){
		date = "01";
	} else {
		var lastDay = new Date(year, month, "");
		date = lastDay.getDate();
	}
	
    return year + "." + $.addzero(month) + "." + date;
};

//한자리가 되는 숫자에 "0"을 넣어주는 함수 2015-04-22 박규태 추가
$.addzero = function(n){                        
    return n < 10 ? "0" + n: n;
};

//날짜 요일 가져오기 2015-04-22 박규태 추가
$.getInputDayLabel = function(winDate) {
     
    var week = new Array('일', '월', '화', '수', '목', '금', '토');
     
    var today = new Date(winDate).getDay();
    var todayLabel = week[today];
     
    return todayLabel;
};

//셀렉트 박스 국번 options 세팅(selectId : selectBox ID) 2015-04-22 박규태 추가
$.renderLocalNo = function(selectId){
	var optionLocalNo = '';
	optionLocalNo += '<option value="02" selected="selected">02</option>';
	optionLocalNo += '<option value="031">031</option>';
	optionLocalNo += '<option value="032">032</option>';
	optionLocalNo += '<option value="033">033</option>';
	optionLocalNo += '<option value="041">041</option>';
	optionLocalNo += '<option value="042">042</option>';
	optionLocalNo += '<option value="043">043</option>';
	optionLocalNo += '<option value="044">044</option>';
	optionLocalNo += '<option value="051">051</option>';
	optionLocalNo += '<option value="052">052</option>';
	optionLocalNo += '<option value="053">053</option>';
	optionLocalNo += '<option value="054">054</option>';
	optionLocalNo += '<option value="055">055</option>';
	optionLocalNo += '<option value="061">061</option>';
	optionLocalNo += '<option value="062">062</option>';
	optionLocalNo += '<option value="063">063</option>';
	optionLocalNo += '<option value="064">064</option>';
	optionLocalNo += '<option value="0130">0130</option>';
	optionLocalNo += '<option value="080">080</option>';
	optionLocalNo += '<option value="070">070</option>';
	optionLocalNo += '<option value="0506">0506</option>';
	optionLocalNo += '<option value="0505">0505</option>';
	optionLocalNo += '<option value="0504">0504</option>';
	optionLocalNo += '<option value="0503">0503</option>';
	optionLocalNo += '<option value="0502">0502</option>';
	optionLocalNo += '<option value="0507">0507</option>';
	optionLocalNo += '<option value="0303">0303</option>';
	$("#" + selectId).append(optionLocalNo);
};

//셀렉트 박스 국번/핸드폰 앞자리 options 세팅(selectId : selectBox ID) 2015-04-25 박규태 추가
$.renderNo = function(selectId){
	var optionNo = '';
	optionNo += '<option value="010" selected="selected">010</option>';
	optionNo += '<option value="011">011</option>';
	optionNo += '<option value="016">016</option>';
	optionNo += '<option value="017">017</option>';
	optionNo += '<option value="018">018</option>';
	optionNo += '<option value="019">019</option>';
	optionNo += '<option value="02">02</option>';
	optionNo += '<option value="031">031</option>';
	optionNo += '<option value="032">032</option>';
	optionNo += '<option value="033">033</option>';
	optionNo += '<option value="041">041</option>';
	optionNo += '<option value="042">042</option>';
	optionNo += '<option value="043">043</option>';
	optionNo += '<option value="044">044</option>';
	optionNo += '<option value="051">051</option>';
	optionNo += '<option value="052">052</option>';
	optionNo += '<option value="053">053</option>';
	optionNo += '<option value="054">054</option>';
	optionNo += '<option value="055">055</option>';
	optionNo += '<option value="061">061</option>';
	optionNo += '<option value="062">062</option>';
	optionNo += '<option value="063">063</option>';
	optionNo += '<option value="064">064</option>';
	optionNo += '<option value="0130">0130</option>';
	optionNo += '<option value="080">080</option>';
	optionNo += '<option value="070">070</option>';
	optionNo += '<option value="0506">0506</option>';
	optionNo += '<option value="0505">0505</option>';
	optionNo += '<option value="0504">0504</option>';
	optionNo += '<option value="0503">0503</option>';
	optionNo += '<option value="0502">0502</option>';
	optionNo += '<option value="0507">0507</option>';
	optionNo += '<option value="0303">0303</option>';
	$("#" + selectId).append(optionNo);
};

//셀렉트 박스 Email 도메인 options 세팅 2015-04-22 박규태 추가
$.renderEmail = function(selectId){
	var optionEmail = '';
	optionEmail += '<option value="" selected="selected">직접입력</option>';
	optionEmail += '<option value="naver.com">naver.com</option>';
	optionEmail += '<option value="hanmail.net">hanmail.net</option>';
	optionEmail += '<option value="hotmail.com">hotmail.com</option>';
	optionEmail += '<option value="nate.com">nate.com</option>';
	optionEmail += '<option value="yahoo.co.kr">yahoo.co.kr</option>';
	optionEmail += '<option value="empas.com">empas.com</option>';
	optionEmail += '<option value="dreamwiz.com">dreamwiz.com</option>';
	optionEmail += '<option value="freechal.com">freechal.com</option>';
	optionEmail += '<option value="lycos.co.kr">lycos.co.kr</option>';
	optionEmail += '<option value="korea.com">korea.com</option>';
	optionEmail += '<option value="gmail.com">gmail.com</option>';
	optionEmail += '<option value="hanmir.com">hanmir.com</option>';
	optionEmail += '<option value="paran.com">paran.com</option>';
	$("#" + selectId).append(optionEmail);
};

//셀렉트 박스 핸드폰 앞자리 options 세팅 2015-04-22 박규태 추가
$.renderHp = function(selectId){
	var optionHp = '';
	optionHp += '<option value="010" selected="selected">010</option>';
	optionHp += '<option value="011">011</option>';
	optionHp += '<option value="016">016</option>';
	optionHp += '<option value="017">017</option>';
	optionHp += '<option value="018">018</option>';
	optionHp += '<option value="019">019</option>';
	$("#" + selectId).append(optionHp);
};

//쿠키 만들기
$.createCookie = function(name, value, days) {
    var expires;
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    } else {
        expires = "";
    }
    document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + expires + "; path=/";
};

//쿠키 값 확인
$.readCookie = function(name){
    var nameEQ = encodeURIComponent(name) + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
};

//쿠키 지우기
$.eraseCookie = function(name){
	$.createCookie(name, "", -1);
};

//금액에 콤마 표시
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

function getDateObjectFromFullString( tDate ) {
	//Apr 24, 2015 12:00:00 AM
	var monthArray = {"Jan":0, "Feb":1, "Mar":2, "Apr":3, "May":4, "Jun":5, "Jul":6, "Aug":7, "Sep":8, "Oct":9, "Nov":10, "Dec":11};
	var temp = tDate.split(' '); // 구분자를 스페이스로 나눈다.
	var month = monthArray[temp[0]];
	var day = temp[1].split(',');
	var year = temp[2];
	
	return new Date(year, month, day[0]);
}

//날짜 포맷 변경
function getDateFormat( tDate, formatStr ){ 		
	var rtn = new Date();
	
	try{
		if(tDate instanceof Date) {
			 rtn = new Date(tDate);
		} else {
			if ( tDate.length > 10 ) {
				rtn = getDateObjectFromFullString(tDate);
			} else if ( tDate.indexOf("-") > -1 ) {
				var temp    = tDate.split('-');   // 구분자(-)를 기준으로 나눈다
				rtn = new Date(temp[0], temp[1], temp[2])
			} else if ( tDate.indexOf(".") > -1 ) {
				var temp    = tDate.split('.');   // 구분자(-)를 기준으로 나눈다
				rtn = new Date(temp[0], temp[1], temp[2])
			} else if( tDate == rtn) {
				rtn = new Date( tDate );
			} else {
				if ( tDate.length == 8 ) {
					rtn = new Date( tDate.substring(0,4), tDate.substring(4,6), tDate.substring(6,8) );
				}
			}
		}
		
	} catch(e) {
		return; 
	}
	
 	//var rtn = new Date( tDate );
	function addZero( str ){
		if ( String(str).length == 1 ) str = "0" + str; 			
		return str;
	};
	return rtn.getFullYear() + formatStr + addZero( rtn.getMonth() + 1 ) + formatStr + addZero( rtn.getDate() );		
}

 	

//UTF-8 문자열의 Byte 크기 구하기.
//주의!! : UTF-8 웹 페이지에서만 정상작동한다. EUC-KR에서는 작동하지 않는다.
//참고 자료 : http://ko.wikipedia.org/wiki/UTF-8 위키 백과의 UTF-8 항목
//테스트 환경 : IE6, IE7, FF 2.0, Safari 3, Opera 9.2
//각 문자의 유니코드 코드를 분석하여, UTF-8로 변환시 차지하는
//byte 수를 리턴한다.
function charByteSize(ch) {
	if (ch == null || ch.length == 0) {
		return 0;
	}

	var charCode = ch.charCodeAt(0);

	if (charCode <= 0x00007F) {
		return 1;
	} else if (charCode <= 0x0007FF) {
		return 2;
	} else if (charCode <= 0x00FFFF) {
		return 3;
	} else {
		return 4;
	}
}

//문자열을 UTF-8로 변환했을 경우 차지하게 되는 byte 수를 리턴한다.
function stringByteSize(str) {
	if (str == null || str.length == 0) {
		return 0;
	}
	var size = 0;

	for (var i = 0; i < str.length; i++) {
		size += charByteSize(str.charAt(i));
	}
	return size;
}

// 비밀번호 유효성 체크
// passwordValue : 패스워드값, webId : 아이디 인풋Id
function pwdcmd(passwordValue, webId) {
    var geStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var b = true;
    var pattern = /\s/g;

    passwordValue += "";
    j = 1;
    be = "";

    if( passwordValue.match(pattern) ) { 
    	return "비밀번호는 공백이 포함될 수 없습니다.";
    }
    
    if (passwordValue.length < 8 || passwordValue.length > 16) {
        return "비밀번호는 8~16자로 입력해주셔야 합니다.";
    }

    if ( $("#"+webId).length > 0){
	    if (passwordValue == $("#"+webId).val()) {
	        return "아이디와 비밀번호가 같을수 없습니다.";
	    }
    }

    for (i = 0; i < passwordValue.length; i++) {
        tm = passwordValue.substring(i, i + 1);

        j = (be == tm) ? j + 1 : 1;
        if (j > 2) b = false;

        be = tm;
    }

    if (b == false) return "비밀번호는 같은문자나 숫자가 3자 이상일수 없습니다.";

    b = true;
    for (i = 0; i < geStr.length; i++) {
        if (i + 3 > passwordValue.length) break;
        tm = passwordValue.substring(i, i + 3) + "";
        if (geStr.indexOf(tm) > -1) b = false;
    }
    if (b == false) return "비밀번호는 연속된 숫자나 문자열을 \n 3자 이상 사용하실수 없습니다.";

    b = true;
    if (passwordValue.search(/[0-9]/g) == -1) b = false;
    if (passwordValue.search(/[a-zA-Z]/g) == -1) b = false;
    if (b == false) return "비밀번호는 문자/숫자/특수문자를 혼합하여 \n 8~16자로 사용하여 주세요.";

    var regExp = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi
    if ( !regExp.test(passwordValue) ){
    	return "비밀번호는 문자/숫자/특수문자를 혼합하여 \n 8~16자로 사용하여 주세요.";
    }
    
    return "";
}

// 셀렉트박스 날짜채워주는 펑션(initDateSelectBox)은 fmt사용으로 인해 js.tag로 이동
//년, 월이 바뀌었을 때 날짜를 바꿔주고 기존선택값이 없으면 남은값중 최대한 큰값을 골라준다.
function changeDateSelectBox(formId, filedPrefix){
	// 기존 선택일자
	var selectedDay = $("#"+formId+" #"+filedPrefix+"Day").val();
	// 말일 구하기
	var days = new Date(new Date($("#"+formId+" #"+filedPrefix+"Year").val(), parseInt($("#"+formId+" #"+filedPrefix+"Month").val()), 1)-86400000).getDate();
	// 기존일자 삭제
	$("#"+formId+" #"+filedPrefix+"Day option").remove();
	for (var i=0, j; i < days; i++) {
		j = (i < 9) ? '0'+(i+1) : i+1;
		//$("#"+formId+" #"+filedPrefix+"Day").append(new Option(j, j));
		$("#"+formId+" #"+filedPrefix+"Day").append("<option value='" + j + "'>" + j + "</option>");
	}
	$("#"+formId+" #"+filedPrefix+"Day").val(selectedDay);
	if ( null == $("#"+formId+" #"+filedPrefix+"Day").val() ){
		$("#"+formId+" #"+filedPrefix+"Day").val(days);
	}
}

// 특수문자 확인 
// parameter : String, object
// TYPE : replace, check (특수문자 목록 차단)
// TYPE : allowReplace, allowCheck (정규식을 이용한 허용한 문자만 통과)
function checkWordSpc(type, obj){
	// 정규식 특수무자
	var regchar = /[^a-zA-Z0-9ㄱ-ㅎ가-힣\(\)]/gi;  //"\특수문자"
	// 특수문자 목록
	var regcharList ="{}[]<>?|~`!@#$%^&*+\"'\\.,/=-_"; // 특수문자 "{}[]()<>?|~`!@#$%^&*+\"'\\.,/=-_";
	// 입력 값
	var str = obj.value;
	// 확인처리 초기값
	var chkBol = false;
	
	//특수문자 목록 확인 후 특수문자 처리
	if(type == "replace" || type == "check" ){
		if(type == "replace"){
			// 차단 특수문자 확인 후 치환
	   		for(var i=0; i<str.length; i++){
	   			if(regcharList.indexOf(str.charAt(i)) != -1){
	   				$("input[name="+obj.name+"]").val(str.replace(str.charAt(i),""));
	   			}
	   		}
		}else if(type == "check"){
			//차단 특수문자 확인 후 결과 리턴
	   		for(var i=0; i<str.length; i++){
	   			if(regcharList.indexOf(str.charAt(i)) != -1){
	   				chkBol = true;
	   			}
	   		}
	   		return chkBol;
		}
	}else{
	//정규식을 이용한 특수문자 처리
		if(type == "allowReplace"){
			// 정규식으로 허용된 것만 확인 후 치환			
			try{
				if(regchar.test(str)==true){
					$("input[name="+obj.name+"]").val(str.replace(regchar,""));
				}
			}catch(e){
				alert(e); return;  //에러날경우 Object Error 메세지 출력
			}
		}else if(type == "allowCheck"){
			// 정규식으로 허용된 것만 확인 후 치환
			var ckb = obj.value; 
			try{
			   ck = regchar.test(ckb);
			   if(ck==true){
				  chkBol = true;
				  return chkBol;
			  }
			}catch(e){
			  alert(e); return;  //에러날경우 Object Error 메세지 출력
			}		
		}else{
			alert("타입이 틀립니다. 관리자에게 문의 바랍니다.");
			return false;
		}
	}
}


//특정 영역 인쇄 함수
//1 window.open('');                  // loads in the Cordova WebView 
//2 window.open('', '_self');         // loads in the Cordova WebView
//3 window.open('', '_system');       // Security error: system browser, but url will not load (iOS)
//4 window.open('', '_blank');        // loads in the InAppBrowser
//5 window.open('', 'random_string'); // loads in the InAppBrowser
//6 window.open('', 'random_string', 'location=no'); // loads in the InAppBrowser, no location bar
function printIt(printThis)  {
	var win = window.open("","random_string");
    win.document.open();
    win.document.write('<html><head>');
    win.document.write($("head").html())
    win.document.write('</head><body>');
    win.document.write(printThis);
    win.document.write('</body></html>');
    win.document.close();
    setTimeout(function () {
	   win.focus();
	   win.print();
    }, 500);
}


//request parameter 가져오기
function getUrlParameter(sParam){
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) 
    {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) 
        {
            return sParameterName[1];
        }
    }
}

/**
 * 입력된 문자열 길이 체크
 * 2015.06.01
 * @param event
 * @param maxSize
 */
function maxInputChar(event, maxSize){
	var tempText = $("#"+event.target.id);
    var tempChar = "";                                        
    var tempChar2 = "";                                       
    var countChar = 0;                                        
    var tempHangul = 0;                                      
    
    // 글자수 바이트 체크를 위한 반복
    for(var i = 0 ; i < tempText.val().length; i++) {
        tempChar = tempText.val().charAt(i);
        //한글
        if(escape(tempChar).length > 4) {
            countChar += 2;
            tempHangul++;
        } else {
            countChar++;
        }
    }
    
    if((countChar-tempHangul) > maxSize) {
        alert("최대 "+maxSize+"자까지 입력 해주세요.");            
        tempChar2 = tempText.val().substr(0, maxSize-1);
        tempText.val(tempChar2);
    }
}

