$(function(){
	
	var result = new Array();		//存放结果的数组,已经被选中的地点的数组
	var jsonData = {};		//JSONd对象，存储JSON中载入的数据
	var $reminder = $('#reminder');		//因为要经常用到，所以放入变量中
	var $resultTitle = $('#resultTitle');
	var markers = new Array();		//存放标注
	
	var center = new qq.maps.LatLng(23.4130, 116.635);
	//腾讯地图初始化
	stumap = new qq.maps.Map(document.getElementById("allmap"),{
		center: center,
		zoom: 16,
		minZoom:15,
		disableDefaultUI: true,
	});
	//路线规划对象
	var walking = new qq.maps.DrivingService({		
		map: stumap
	});
	
	/*以下为枫枫增加*/
	var size=new qq.maps.Size(30,35);
	var iconbasic=new qq.maps.MarkerImage(
		"icons/iconbasic.png",
		size,
	);
	var iconselect=new qq.maps.MarkerImage(
		"icons/iconselect.png",
		size,
	);
	var iconsearch=new qq.maps.MarkerImage(
		"icons/iconsearch.png",
		size,
	);
	/*以上为枫枫增加*/
	
	//添加一个点
	function addMarker(lng, lat, title, id){

		var point = new qq.maps.LatLng(lat, lng);
		var marker = new qq.maps.Marker({	//添加标注点
			position: point,
			map: stumap,
			title: String(id),
			icon:iconbasic
		});
		
		var label = new qq.maps.Label({		//添加标注信息，文字
			position: point,
			map: stumap,
			offset: new qq.maps.Size(10, -5),
			content: title
		});
		
		label.setStyle({	//标注样式
			color: "#444",//这个东西不太一般啊，暗藏玄机
			backgroundColor: "ghostwhite",
			border: "1px solid #DDDDDD",
			fontSize: "12px",
		});
		
		qq.maps.event.addListener(marker, 'mouseover', function() {		//鼠标放置跳动
			this.setAnimation(qq.maps.MarkerAnimation.BOUNCE);
		});
		
		qq.maps.event.addListener(marker, 'mouseout', function() {		//鼠标移开停止
			this.setAnimation(null);
		});
		
		qq.maps.event.addListener(marker, 'click', function(){	//点击加入到列表
			var $list = $('#nodelist>ul>li>a');
			var flag = 0
			var thisMarker = label.getContent()
			$list.each(function(){
				flag = ($(this).text()===thisMarker)?1:flag;
			});
			if(flag === 1){
				$reminder.text('已存在');
			}else{
				$reminder.text('');
				$('<li><a href="">' + label.getContent() + '</a><span class="invisible">' + this.getTitle() + '</span></li>').appendTo('#nodelist ul').hide().fadeIn(300);
			}
			this.setIcon(iconselect);	//将marker改成了this
		});
		
		qq.maps.event.addListener(label, 'click', function(){		//点击标注展示照片
			openView(this.getContent());
		});
		
		label.setVisible(true);
		return marker;
	}
	
	//照片展示
	function openView(name){
		var elContent = '<div class="modal-view"><img src="images/' + name +'.png" /></div>';
		var $content = $(elContent);   
		modal.open({
			content: $content,
			width:800, 
			height:600
		});
	}
	
	//动画清除列表
	function animation(type, el){
		if(type === 1){
			$(el).animate({		//向右
				opacity:0.0,
				paddingLeft:'+=200'
			}, 500, function(){			
				$('ul.rectangle-list').html('').animate({
					opacity:1,
					paddingLeft:'-=200'
				},1);
			});
		}else{
			$(el).animate({		//向下
				opacity:0.0,
				paddingTop:'+=200'
			}, 500, function(){			
				$('ul.rounded-list').html('').animate({
					opacity:1,
					paddingTop:'-=200'
				},1);
			});
		}
	}
	
	//改变样式
	function changetype(type){
		var $list = $('#nodelist>ul>li>a');	
			$list.each(function(){
				var i =$(this).next().text();
				markers[i].setIcon(type);
			});
	}
	
	//恢复为基本样式
	function recover(){
		for(var i = 0; i < markers.length; i++){
			markers[i].setIcon(iconbasic);
		}
	}
	
	//载入JSON
	function getJSON(){
		$.ajax({
			beforeSend: function(xhr){		//该方法告知应该返回JSON数据
				if(xhr.overrideMimeType){	
					xhr.overrideMimeType("application/json");
				}
			}
		});

		$.getJSON('data/data.json')
		.done(function(data){
			jsonData = data;
			for(var i = 0; i < jsonData.length; i ++){
				markers.push(addMarker(jsonData[i].lng, jsonData[i].lat, jsonData[i].name, i));
			}
		}).fail(function(){
			alert("找不到数据！");
		});
	}
	
	getJSON();		//载入JSON
	
	//添加删除事件+事件代理
	$('ul.rectangle-list').on('click', 'li a', function(e){
		e.preventDefault();
		$reminder.text('');
		$(this).animate({
			opacity: 0.0,
		}, 300, function(){ //加了easing参数就运行不了
			$(this).remove();
		});
		var i = parseInt($(this).next().text());
		markers[i].setIcon(iconbasic);
	});
	
	//给按钮添加事件
	$('div.btnlist').on('click', 'button', function(e){
		e.preventDefault();
		var id = $(this).attr("id");
		if(id === 'reset'){		//点击归位
			stumap.setCenter(center);
			stumap.setZoom(16);
		}else if(id === 'clear'){		//点击清空
			animation(1, 'ul.rectangle-list');
			$reminder.text('');		//清空reminder
			
			recover();
//			changetype(iconbasic);
			
			if($('ul.rounded-list').is(':has(li)')){		//如果有生成结果则删除
				animation(2, 'ul.rounded-list');
				walking.clear();	//随便猜猜居然真有这个函数
				$resultTitle.text('');
			}
		}else if(id === 'run'){		//点击生成
			var selected = new Array();
			changetype(iconsearch);
			$('ul.rectangle-list>li>a').each(function(index){
				selected.push(parseInt($(this).next().text()));		//传入的是整数
				
			});
			animation(1, 'ul.rectangle-list');
			$reminder.text('');
			//selected是一个数组对象 其length属性为数组的长度
			
			//-----------------------------------算法-------------------------------------
			var last;
			var index=0;
			var arrNum=new Array(selected.length);//存地点编号 
			for(var i=0;i<selected.length;i++)//排除重复编号 并且将点放入地点编号数组
			{
				var flag=1;
				if(selected[i]>27&&selected[i]<31)
					selected[i]=21;
				if(selected[i]==31)
					selected[i]=19;
				if(selected[i]==32)
					selected[i]=17;
				if(selected[i]==33)
					selected[i]=10;
				if(selected[i]==34)
					selected[i]=4;
				if(selected[i]>34&&selected[i]<40)
					selected[i]=6
				if(selected[i]==40)
					selected[i]=15;
					
				for(var k=0;k<index;k++)
					if(selected[i]==arrNum[k])  //编号  现在不知道 num代替
					{
						flag=0;
						break;
					}
				if(flag==0)
					continue;
				arrNum[index]=selected[i];
				index=index+1;
			}
			
			for(var i=0;i<index;i++)
				console.log(arrNum[i]);
			
			console.log('-');
			
			last=index;
			var ans=new Array(last);//答案
			var ansindex=0;
			
			var currentSize=arrNum[0];
			last=last-1;
			ans[ansindex]=arrNum[0];
			ansindex=ansindex+1;
			for(var i=0;i<last;i++)
				{
					arrNum[i]=arrNum[i+1];
				}
			console.log(arrNum);//2 3
			console.log(ans);
			console.log(last);
			while(last>1){//剩余一个终点
				var CBarr=new Array(last);
				var flag=0;
				for(var  i=0;i<last-1;i++)//不计算终点所以-1{
//					if(arr[currentSize][arrNum[i]]==-1)
//						CBarr[i]=1<<16;
//					
					{
						console.log(currentSize);
						console.log(Arr[currentSize][arrNum[i]]);
					if(Arr[currentSize][arrNum[i]]!==-1){
						CBarr[i]=arr[currentSize][arrNum[i]]+arr[arrNum[i]][arrNum[last-1]];
						flag=1;
					}
					else
						CBarr[i]=1<<16;
				}
				if(flag==0)
					{
						for(var  i=0;i<last-1;i++)//不计算终点所以-1{
//					if(arr[currentSize][arrNum[i]]==-1)
//						CBarr[i]=1<<16;
//					
					{		
						CBarr[i]=arr[currentSize][arrNum[i]];
					}
				}
				var min=1<<16;
				var minindex;
				console.log("CBarr");
				console.log(CBarr);
				for(var i=0;i<last-1;i++)//得出f值最小
					if(CBarr[i]<min)
					{
						min=CBarr[i];
						minindex=i;
						console.log(minindex);
					}
				currentSize=arrNum[minindex];
				ans[ansindex]=arrNum[minindex];
				ansindex=ansindex+1;
				for(var i=minindex;i<last;i++)
					arrNum[i]=arrNum[i+1];
				last=last-1;
				
			}
			
			ans[ansindex]=arrNum[0];
			ansindex=ansindex+1;;
			
			console.log(ans);
			//-----------------------------------算法-------------------------------------
			result = ans;
			//通过算法接口返回一个数组之后，依次把路线画出来
			for(var i = 0; i < result.length-1; i++){
				$('<li><a href="">' + jsonData[result[i]].name + '-' + jsonData[result[i+1]].name + '</a>' + '<span class="invisible">' + i + '</span>' + '</li>')
					.appendTo('#resultlist ul')
					.hide()
					.fadeIn(300);
				$('#resultlist').on('click', 'li a', function(e){
					e.preventDefault();
					var n = parseInt($(this).next().text());
					var p1 = new qq.maps.LatLng(jsonData[result[n]].lat, jsonData[result[n]].lng);
					var p2 = new qq.maps.LatLng(jsonData[result[n+1]].lat, jsonData[result[n+1]].lng);
					walking.search(p1, p2);
					$resultTitle.text('STEP ' + (n+1));
				});
			}
			
			var p1 = new qq.maps.LatLng(jsonData[result[0]].lat, jsonData[result[0]].lng);
			var p2 = new qq.maps.LatLng(jsonData[result[1]].lat, jsonData[result[1]].lng);
			walking.search(p1, p2);
			$resultTitle.text('RESULT');
		}
	});
	
	//搜索框
	$('#placetext').on('keyup', function(){
		var content = $(this).val();
		if(content !== ''){
			var reg = new RegExp(content);
//			window.alert(reg.test(jsonData[0].name));
			for(var i = 0; i < jsonData.length; i++){
				if(reg.test(jsonData[i].name)){
					markers[i].setAnimation(qq.maps.MarkerAnimation.BOUNCE);
				}else{
					markers[i].setAnimation(null);
				}
			}
		}else{
			for(var i = 0; i < jsonData.length; i++){
				markers[i].setAnimation(null);
			}
		}
	});
	
	//搜索按钮
	$('#searchbutton').on('click', function(e){
		e.preventDefault();
	});
	
});