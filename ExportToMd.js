var config = {
	mdPath:"E:/01 Personal Doc/10 Blog/hexo/lzuliuyun/source/_posts/",
	imgPath:"E:/01 Personal Doc/10 Blog/hexo/lzuliuyun/source/img/"
}

function OnExportMDButtonClicked() {
	var objApp = WizExplorerApp;
	var objWindow = objApp.Window;
	var objDatabase = objApp.Database;
	var objDocument = objWindow.CurrentDocument;
    var doc = objWindow.CurrentDocumentHtmlDocument;
    var docType = objDocument.Type;
    var objCommon = objApp.CreateWizObject("WizKMControls.WizCommonUI");

    if(docType != "markdown"){
        objWindow.ShowMessage("不支持非markdown文档导出", "提示", 0x40);
        return false;
    }

	if (!doc) {
        objWindow.ShowMessage("文档内容为空", "提示", 0x40);
        return false;
    }    

    var title = doc.title;
    var text = doc.body.innerText;

    text = text.replace(/index_files/g,"/img");

    //reference count dialog
    var dtCreated = new Date(objDocument.DateCreated);
	var timeCreated = objCommon.ToLocalDateString(dtCreated, false) + " " + objCommon.ToLocalTimeString(dtCreated);

    //set markdown head info
    var head  = addHead(title,objDocument.Tags,timeCreated,objDocument.Parent.Name);
    text = head + text;
    
    //objWindow.ShowMessage(text, "提示", 0x40);
    // var text = "1111111111111";
    //var objCommonUI = objApp.CreateWizObject("WizKMControls.WizCommonUI");
    //var filename = objCommonUI.SelectWindowsFileEx(false, "Text files (*.md)|*.md|", title, "md");
    //objWindow.ShowMessage(filename, "", 0x40);

     //save docment as tempory files 文档保存为临时文件（提取图片之用）    
	var tempPath = objCommon.GetSpecialFolder("TemporaryFolder");
	tempPath += "export_md_temp/";

	objCommon.CreateDirectory(tempPath);
	tempPath += objDocument.GUID + "/";
	objCommon.CreateDirectory(tempPath);

	var tempImgPath = tempPath + "index_files/";
	objCommon.CreateDirectory(tempImgPath);

	var tempFile = tempPath + "index.html";
	objDocument.SaveToHtml(tempFile, 0);	
     
     //save docment as markdown file文件保存为md文件
    var filename  = config['mdPath'] + title + ".md";
    objCommon.SaveTextToFile(filename, text, "utf-8");

    //copy file from tempory to target folder 复制图片
    var path = objCommon.EnumFiles2(tempImgPath,"*.*",false);
    if(!path) {
		objWindow.ShowMessage("无图片，导出完成", "提示", 0x40);
    	return true;
    }

    var pathArr = path.split("\n");
    var len = pathArr.length;

    var curPath = "",name = "";
    for (var i = 0; i< len;i++) {
    	curPath  = pathArr[i];
    	name  = curPath.substring(curPath.lastIndexOf("/")+1,curPath.length);;
    	curPath = config['imgPath'] + name;
    	objCommon.CopyFile(pathArr[i], curPath);
    }

    objWindow.ShowMessage("有图片，导出完成", "提示", 0x40);
}


function addHead(title,tags,date,categories){
	var ret = [];
	for (var i = 0; i < tags.Count; i++) {
	    ret.push(tags.Item(i).Name);
	}

	tags = ret.join(",");

	var head = "---" + "\n"
			 + "title: " + title + "\n"
	         + "date: " + date + "\n"
             + "categories: " + categories + "\n"
	         + "tags: [" + tags + "]\n"
	         + "comments: " + "true" + "\n"
	         + "toc: " + "true" + "\n"
	         + "---" + "\n";

	return head;
}

function InitHelperButton() {
    var pluginPath = objApp.GetPluginPathByScriptFileName("ExportToMd.js");
    var languangeFileName = pluginPath + "plugin.ini";
    var buttonText = objApp.LoadStringFromFile(languangeFileName, "strExport");
    objWindow.AddToolButton("document", "ExportButton", buttonText, "", "OnExportMDButtonClicked");
  }

InitHelperButton();
