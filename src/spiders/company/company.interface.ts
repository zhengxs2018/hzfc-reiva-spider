export interface Company {
  /**
   * ID
   */
  id: string

  /**
   * 编号
   */
  code: string

  /**
   * 名称
   */
  name: string

  /**
   * 营业执照号
   */
  licenseNo: string

  /**
   * 经营范围
   */
  businessScope: string

  /**
   * 注册资金
   */
  registeredCapital: string

  /**
   * 法人代表
   */
  legalRepresentative: string

  /**
   * 注册地址
   */
  address: string

  /**
   * 联系电话
   */
  tel: string

  /**
   * 员工总数
   */
  staffTotal: number

  /**
   * 是否监管资金账户
   *
   * Fund Supervision Account
   */
  isSFA: boolean

  /**
   * 是否杭房中协会会员
   */
  isAM: boolean
}
