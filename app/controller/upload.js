'use strict';
const fs = require('fs');// 可读可写数据流
const moment = require('moment');// 时间格式化
const mkdirp = require('mkdirp');// 创建多级目录
const path = require('path');// 处理文件路径
const Controller = require('egg').Controller;
class UploadController extends Controller {
  async upload() {

    const { ctx } = this;
    // 需要前往 config/config.default.js 设置 config.multipart 的 mode 属性为 file
    const file = ctx.request.files[0];
    // 声明存放资源的路径
    let uploadDir = '';
    try {

      const f = fs.readFileSync(file.filepath);
      // 1.获取当前日期
      const day = moment(new Date()).format('YYYMMDD');
      // 2.创建图片保存的路径
      const dir = path.join(this.config.uploadDir, day);
      const date = Date.now();
      // await mkdirp(dir);// 不存在就创建
      await mkdirp.mkdirp(dir);
      // 返回图片保存路径

      uploadDir = path.join(dir, date + path.extname(file.filename));
      // 写入文件夹
      fs.writeFileSync(uploadDir, f);

    } finally {
      // 清除临时文件
      ctx.cleanupRequestFiles();
    }
    ctx.body = {
      code: 200,
      msg: '上传成功',
      data: uploadDir.replace(/app/g, ''),

    };
  }
}
module.exports = UploadController;
