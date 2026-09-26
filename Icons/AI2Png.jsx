#target illustrator
// 递归遍历子文件夹、PPI弹窗，png输出在ai同目录
// 多画板全部内容合并到一张PNG，透明PNG24
#targetengine session

var run = true;

// -------------------------- 弹出PPI输入框（dialog模态窗口，可点击确定） --------------------------
var dlg = new Window("dialog", "导出PNG设置", [100,100,380,180]);
dlg.add("statictext", [20,20,280,45], "设置导出PPI（默认72）");
var ppiInput = dlg.add("edittext", [20,50,200,75], "72");
dlg.add("statictext", [20,80,280,100], "提示：144=2倍，300=高清。输入数字");
var btnGroup = dlg.add("group", [20,110,280,145]);
btnGroup.orientation = "row";
var okBtn = btnGroup.add("button", [0,0,120,30], "确定", {name:"ok"});
var cancelBtn = btnGroup.add("button", [140,0,120,30], "取消");

okBtn.onClick = function(){
    this.parent.parent.close(1);
}
cancelBtn.onClick = function(){
    this.parent.parent.close(0);
}

var ret = dlg.show();

if(!ret){
    run = false;
}
else{
    var targetPpi = parseFloat(ppiInput.text);
    if(isNaN(targetPpi) || targetPpi <=0){
        alert("PPI必须是大于0的数字");
        run = false;
    }
}

if(run)
{
    // AI导出PNG的scale换算：AI默认文档PPI是72
    var scalePercent = (targetPpi /72)*100;

    // -------------------------- 递归遍历文件夹函数 --------------------------
    function scanFolder(folder){
        var files = folder.getFiles();
        for(var i=0; i<files.length;i++){
            var item = files[i];
            if(item instanceof Folder){
                scanFolder(item);
            }else{
                if(item instanceof File && /\.ai$/i.test(item.name)){
                    exportAiFile(item);
                }
            }
        }
    }

    // -------------------------- 单个AI导出函数 --------------------------
    function exportAiFile(aiFile){
        try{
            var doc = app.open(aiFile);

            var pngOpt = new ExportOptionsPNG24();
            pngOpt.transparency = true;
            pngOpt.antiAliasing = true;
            pngOpt.artBoardClipping = false;
            pngOpt.horizontalScale = scalePercent;
            pngOpt.verticalScale = scalePercent;

            var outPath = new File(aiFile.parent + "/" + aiFile.name.replace(/\.ai$/i,".png"));
            doc.exportFile(outPath, ExportType.PNG24, pngOpt);

            doc.close(SaveOptions.DONOTSAVECHANGES);
            $.writeln("✅ " + aiFile.fullName + " → " + outPath.name);
        }catch(e){
            alert("❌导出失败文件：\n"+aiFile.fullName +"\n错误信息："+e.message);
        }
    }

    // -------------------------- 选择根目录开始扫描 --------------------------
    var rootFolder = Folder.selectDialog("选择【根目录】，递归查找所有子文件夹里的AI");
    if(rootFolder != null){
        app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
        scanFolder(rootFolder);
        alert("✅全部任务执行完毕！");
    }
}
