var config = {
    mdPath:"D:/WorkSpace/BadMushroom_Blog/source/_posts/",//设置导出md文件目录
    imgPath:"D:/WorkSpace/BadMushroom_Blog/source/_posts/",//设置导出md文件对应图片文件夹的目录
    showRootDir: true
}

//回调函数，按钮点击事件
function OnExportMDButtonClicked() {
    var objApp = WizExplorerApp,
        objWindow = objApp.Window,
        objDocument = objWindow.CurrentDocument,////获得当前Wiz正在显示的Wiz文档对象，可能为null。类型为：WizDocument
        objCommon = objApp.CreateWizObject("WizKMControls.WizCommonUI"),//创建一个Wiz内部对象    
        tempDocument = getTempDocumentInfo(objCommon, objDocument);

    if (!tempDocument.text) {
        objWindow.ShowMessage("文档内容为空, 导出失败", "提示", 0x40);
        return false;
    }
	// objWindow.ShowMessage(tempDocument.text, "提示", 0x40);
    tempDocument.text = modifyDocument(objCommon, objDocument, tempDocument.text);
    // objWindow.ShowMessage("啦啦", "提示", 0x40);
    saveFile(objCommon, objDocument, objWindow, tempDocument);
}

//获取导出html格式信息
function getTempDocumentInfo(objCommon, objDocument) {
    /*获得指定的文件夹路径。bstrFolderName：文件夹名称，可能的值为：
    WindowsFolder，Windows安装目录，一般是C:\Windows
    SystemFolder：系统目录，C:\Windows\System32
    TemporaryFolder：临时文件夹
    AppPath：Wiz安装路径
    返回值：全路径名*/
    var tempPath = objCommon.GetSpecialFolder("TemporaryFolder") + "export_md_temp/";
    objCommon.CreateDirectory(tempPath);
    tempPath += objDocument.GUID + "/";//获得文档的GUID
    objCommon.CreateDirectory(tempPath);

    var tempImgPath = tempPath + "index_files/",
        tempFile = tempPath + "index.html";
    objCommon.CreateDirectory(tempImgPath);

    objDocument.SaveToHtml(tempFile, 0);
	
    return {
        text: convertHtmlToText(objCommon.LoadTextFromFile(tempFile)),
        imagePath: tempImgPath
    }
}

//将html格式转化成md格式
function convertHtmlToText(text) {
	//objWindow.ShowMessage("啦啦0", "提示", 0x40);
    var text_match = text.match('<body(.*?)>(.*)</body>');//匹配body标签中的内容
    text = text_match[2];
    text = text.replace(/<\/div>/gm, "</div><br>");//div标签后添加br标签
    text = text.replace(/<br>/gm, '\n');//br标签替换为换行
    text = text.replace(/<img(.*?)src="(.*?)"(.*?)>/gm, "![]($2)");//img标签替换为md格式的图片
    text = text.replace(/<[^>]+>/gm, "");//去掉所有标签
    text = text.replace(/&lt;/gm, '<');//转换html转义字符
    text = text.replace(/&gt;/gm, '>');
    text = text.replace(/&nbsp;/gm, ' ');
    text = text.replace(/&amp;/gm, '&');
    text = text.replace(/&quot;/gm, '"');
    text = text.replace(/&apos;/gm, "'");
    return text;
}

//修改文件
function modifyDocument(objCommon, objDocument, text) {
    text = setHeadInfo(objCommon, objDocument, text);
    text = setImagePath(text);
    return text;
}

function setImagePath(text) {
    return text.replace(/index_files\//g,"");
}

function deleteDescLabel(text) {
    return  text = text.replace(/---[\s\S]*?---/gm, '')
}

function deleteEdtag (text) {
    //fix unuseful content bug
    return text.replace(/<ed_tag.*?<\/ed_tag>/g, '');
}

function setHeadInfo(objCommon, objDocument, text) {
    var categories = objDocument.Parent.Name,
        dtCreated = new Date(objDocument.DateCreated),
        timeCreated = objCommon.ToLocalDateString(dtCreated, false) + " " + objCommon.ToLocalTimeString(dtCreated),
        location = objDocument.Location;

    if (config.showRootDir && location.match(/^\/([\w-]+)\/?/)) {
        categories = location.match(/^\/([\w-\s]+)\/?/)[1]
    }

    var head = addHeadToDocument(text, {
        title: objDocument.Title.replace(/\.md$/g, ''),
        tags: objDocument.Tags,
        date: timeCreated,
        categories: categories
    })

    text = deleteDescLabel(text)

    text = head + text;
    return text;
}

//保存文件，复制md文件和图片文件
function saveFile(objCommon, objDocument, objWindow, tempDocument) {
	var paperName = objDocument.Title.replace(/\.md$/g, "")
    //save file
    var filename = config['mdPath'] + paperName + ".md";
    objCommon.SaveTextToFile(filename, tempDocument.text, "utf-8");

    var imgPath = config['imgPath'] + paperName + '/';
    imgPath = imgPath.replace('/','\\');
    // objWindow.ShowMessage(imgPath, paperName, 0x40);
    objCommon.CreateDirectory(imgPath);

    //save image. copy file from tempory to target folder 复制图片
    var path = objCommon.EnumFiles2(tempDocument.imagePath, "*.*", false);
    if(!path) {
        objWindow.ShowMessage("文档无图片，导出完成", "提示", 0x40);
        return true;
    }
    var pathArr = path.split("\n"),
        len = pathArr.length,
        curPath = "",
        name = "";

    for (var i = 0; i< len; i++) {
        curPath = pathArr[i];
        name = curPath.substring(curPath.lastIndexOf("/") + 1, curPath.length);;
        curPath = imgPath + name;
        objCommon.CopyFile(pathArr[i], curPath);
    }

    objWindow.ShowMessage("文档有图片，导出完成", "提示", 0x40);
}

function addHeadToDocument(text, docInfo){
    var tags, moreLabels;

    //tags
    var ret = [];
    for (var i = 0; i < docInfo.tags.Count; i++) {
        ret.push(docInfo.tags.Item(i).Name);
    }

    tags = ret.join(",");

    var exec = /---([\s\S]*?)---/gm.exec(text)

    moreLabels = exec ? exec[1].replace(/^\s*|\s*$/g, '').replace(/!\[\]\((.*?)\)/g, '$1') : '';
    //morelabels
    if (moreLabels) {
        var encodeLabels = encodeURIComponent(moreLabels);
        encodeLabels = encodeLabels.replace(/%3A%C2%A0/g, '%3A%20')
        moreLabels = decodeURIComponent(encodeLabels);
    }

    moreLabels = moreLabels || '\n';

    var head = "---" + "\n"
            + "title: " + docInfo.title + "\n"
            + "date: " + docInfo.date + "\n"
            + "categories: " + docInfo.categories + "\n"
            + "tags: [" + tags + "]\n"
            + "comments: " + "true" + "\n"
            + "toc: " + "true" + "\n"
            + moreLabels + "\n"
            + "---" + "\n";

    return head;
}

function InitExoprtToMdButton() {
    var pluginPath = objApp.GetPluginPathByScriptFileName("ExportToMd.js");//当前路径
    var languangeFileName = pluginPath + "plugin.ini";//plugin.ini路径

    
    var buttonText = objApp.LoadStringFromFile(languangeFileName, "strExport");//从ini文件里面获得一个本地化的字符串（strExport is key in plugin.ini file）
    /*
    AddToolButton：添加一个工具栏按钮，目前仅能添加到文档阅读/编辑窗口上面，在阅读/附件按钮后面。
    bstrType必须是"document"；
    bstrButtonID：按钮ID；
    bstrButtonText：按钮文字；
    bstrIconFileName：按钮上面图标的文件，可以指定一个ico文件（包含路径）；
    bstrClickEventFunction：按钮点击后执行的回掉函数。*/
    objWindow.AddToolButton("document", "ExportButton", buttonText, "", "OnExportMDButtonClicked");
  }

InitExoprtToMdButton();
