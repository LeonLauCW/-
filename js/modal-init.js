$(function(){
	var $content = $('#share-options').detach();   // Remove modal from page
	
    modal.open({
		content: $content, 
		width:340, 
		height:300
	});
});