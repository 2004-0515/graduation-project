<template>
  <div class="address-page">
    <Navbar />
    <main class="main-content">
      <div class="container">
        <div class="page-header">
          <h1>收货地址</h1>
          <button class="add-btn" @click="openDialog()">添加地址</button>
        </div>

        <div class="address-list" v-if="addresses.length > 0">
          <div v-for="addr in addresses" :key="addr.id" class="address-card">
            <div class="card-main">
              <div class="addr-header">
                <span class="name">{{ addr.name }}</span>
                <span class="phone">{{ addr.phone }}</span>
                <span class="default-tag" v-if="addr.isDefault">默认</span>
              </div>
              <p class="addr-detail">{{ addr.province }}{{ addr.city }}{{ addr.district }}{{ addr.detail }}</p>
            </div>
            <div class="card-actions">
              <button v-if="!addr.isDefault" @click="setDefault(addr)">设为默认</button>
              <button @click="openDialog(addr)">编辑</button>
              <button class="delete" @click="deleteAddress(addr)">删除</button>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <p>暂无收货地址</p>
        </div>
      </div>
    </main>

    <!-- 地址弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑地址' : '添加地址'" width="480px">
      <el-form :model="addressForm" label-position="top">
        <el-form-item label="收货人">
          <el-input v-model="addressForm.name" placeholder="请输入收货人姓名" />
        </el-form-item>
        <el-form-item label="手机号">
          <div class="phone-input-row">
            <el-input v-model="addressForm.phone" placeholder="请输入手机号" />
            <button type="button" class="use-my-phone-btn" @click="useMyPhone" v-if="userStore.userInfo?.phone">
              使用个人手机
            </button>
          </div>
        </el-form-item>
        <el-form-item label="所在地区">
          <el-cascader
            v-model="regionValue"
            :options="cascaderOptions"
            :props="{ expandTrigger: 'hover' }"
            placeholder="请选择省/市/区"
            clearable
            filterable
            style="width: 100%"
            @change="onRegionChange"
          />
        </el-form-item>
        <el-form-item label="详细地址">
          <el-input v-model="addressForm.detail" type="textarea" :rows="2" placeholder="请输入详细地址" />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="addressForm.isDefault">设为默认地址</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <button class="btn-cancel" @click="dialogVisible = false">取消</button>
        <button class="btn-confirm" @click="saveAddress">保存</button>
      </template>
    </el-dialog>

    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '../stores/userStore'
import addressApi from '../api/addressApi'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

const userStore = useUserStore()
const addresses = ref<any[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)

// 省市区数据
const regionData: Record<string, Record<string, string[]>> = {
  '北京市': { '北京市': ['东城区', '西城区', '朝阳区', '丰台区', '石景山区', '海淀区', '门头沟区', '房山区', '通州区', '顺义区', '昌平区', '大兴区', '怀柔区', '平谷区', '密云区', '延庆区'] },
  '上海市': { '上海市': ['黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区', '闵行区', '宝山区', '嘉定区', '浦东新区', '金山区', '松江区', '青浦区', '奉贤区', '崇明区'] },
  '天津市': { '天津市': ['和平区', '河东区', '河西区', '南开区', '河北区', '红桥区', '东丽区', '西青区', '津南区', '北辰区', '武清区', '宝坻区', '滨海新区', '宁河区', '静海区', '蓟州区'] },
  '重庆市': { '重庆市': ['万州区', '涪陵区', '渝中区', '大渡口区', '江北区', '沙坪坝区', '九龙坡区', '南岸区', '北碚区', '綦江区', '大足区', '渝北区', '巴南区', '黔江区', '长寿区', '江津区', '合川区', '永川区', '南川区', '璧山区', '铜梁区', '潼南区', '荣昌区', '开州区', '梁平区', '武隆区'] },
  '广东省': { 
    '广州市': ['越秀区', '海珠区', '荔湾区', '天河区', '白云区', '黄埔区', '番禺区', '花都区', '南沙区', '从化区', '增城区'],
    '深圳市': ['罗湖区', '福田区', '南山区', '宝安区', '龙岗区', '盐田区', '龙华区', '坪山区', '光明区'],
    '珠海市': ['香洲区', '斗门区', '金湾区'],
    '东莞市': ['东莞市'],
    '佛山市': ['禅城区', '南海区', '顺德区', '三水区', '高明区'],
    '中山市': ['中山市'],
    '惠州市': ['惠城区', '惠阳区', '博罗县', '惠东县', '龙门县']
  },
  '江苏省': {
    '南京市': ['玄武区', '秦淮区', '建邺区', '鼓楼区', '浦口区', '栖霞区', '雨花台区', '江宁区', '六合区', '溧水区', '高淳区'],
    '苏州市': ['虎丘区', '吴中区', '相城区', '姑苏区', '吴江区', '昆山市', '太仓市', '常熟市', '张家港市'],
    '无锡市': ['锡山区', '惠山区', '滨湖区', '梁溪区', '新吴区', '江阴市', '宜兴市'],
    '常州市': ['天宁区', '钟楼区', '新北区', '武进区', '金坛区', '溧阳市'],
    '南通市': ['崇川区', '港闸区', '通州区', '海安市', '如东县', '启东市', '如皋市', '海门市']
  },
  '浙江省': {
    '杭州市': ['上城区', '下城区', '江干区', '拱墅区', '西湖区', '滨江区', '萧山区', '余杭区', '富阳区', '临安区', '桐庐县', '淳安县', '建德市'],
    '宁波市': ['海曙区', '江北区', '北仑区', '镇海区', '鄞州区', '奉化区', '余姚市', '慈溪市', '象山县', '宁海县'],
    '温州市': ['鹿城区', '龙湾区', '瓯海区', '洞头区', '永嘉县', '平阳县', '苍南县', '文成县', '泰顺县', '瑞安市', '乐清市'],
    '嘉兴市': ['南湖区', '秀洲区', '嘉善县', '海盐县', '海宁市', '平湖市', '桐乡市'],
    '湖州市': ['吴兴区', '南浔区', '德清县', '长兴县', '安吉县']
  },
  '四川省': {
    '成都市': ['锦江区', '青羊区', '金牛区', '武侯区', '成华区', '龙泉驿区', '青白江区', '新都区', '温江区', '双流区', '郫都区', '新津区'],
    '绵阳市': ['涪城区', '游仙区', '安州区', '三台县', '盐亭县', '梓潼县', '北川县', '平武县', '江油市'],
    '德阳市': ['旌阳区', '罗江区', '中江县', '广汉市', '什邡市', '绵竹市'],
    '宜宾市': ['翠屏区', '南溪区', '叙州区', '江安县', '长宁县', '高县', '珙县', '筠连县', '兴文县', '屏山县']
  },
  '湖北省': {
    '武汉市': ['江岸区', '江汉区', '硚口区', '汉阳区', '武昌区', '青山区', '洪山区', '东西湖区', '汉南区', '蔡甸区', '江夏区', '黄陂区', '新洲区'],
    '宜昌市': ['西陵区', '伍家岗区', '点军区', '猇亭区', '夷陵区', '远安县', '兴山县', '秭归县', '长阳县', '五峰县', '宜都市', '当阳市', '枝江市'],
    '襄阳市': ['襄城区', '樊城区', '襄州区', '南漳县', '谷城县', '保康县', '老河口市', '枣阳市', '宜城市']
  },
  '湖南省': {
    '长沙市': ['芙蓉区', '天心区', '岳麓区', '开福区', '雨花区', '望城区', '长沙县', '浏阳市', '宁乡市'],
    '株洲市': ['荷塘区', '芦淞区', '石峰区', '天元区', '渌口区', '攸县', '茶陵县', '炎陵县', '醴陵市'],
    '湘潭市': ['雨湖区', '岳塘区', '湘潭县', '湘乡市', '韶山市']
  },
  '河南省': {
    '郑州市': ['中原区', '二七区', '管城区', '金水区', '上街区', '惠济区', '中牟县', '巩义市', '荥阳市', '新密市', '新郑市', '登封市'],
    '洛阳市': ['老城区', '西工区', '瀍河区', '涧西区', '吉利区', '洛龙区', '孟津县', '新安县', '栾川县', '嵩县', '汝阳县', '宜阳县', '洛宁县', '伊川县', '偃师市'],
    '开封市': ['龙亭区', '顺河区', '鼓楼区', '禹王台区', '祥符区', '杞县', '通许县', '尉氏县', '兰考县']
  },
  '山东省': {
    '济南市': ['历下区', '市中区', '槐荫区', '天桥区', '历城区', '长清区', '章丘区', '济阳区', '莱芜区', '钢城区', '平阴县', '商河县'],
    '青岛市': ['市南区', '市北区', '黄岛区', '崂山区', '李沧区', '城阳区', '即墨区', '胶州市', '平度市', '莱西市'],
    '烟台市': ['芝罘区', '福山区', '牟平区', '莱山区', '长岛县', '龙口市', '莱阳市', '莱州市', '蓬莱市', '招远市', '栖霞市', '海阳市']
  },
  '福建省': {
    '福州市': ['鼓楼区', '台江区', '仓山区', '马尾区', '晋安区', '长乐区', '闽侯县', '连江县', '罗源县', '闽清县', '永泰县', '平潭县', '福清市'],
    '厦门市': ['思明区', '海沧区', '湖里区', '集美区', '同安区', '翔安区'],
    '泉州市': ['鲤城区', '丰泽区', '洛江区', '泉港区', '惠安县', '安溪县', '永春县', '德化县', '金门县', '石狮市', '晋江市', '南安市']
  },
  '陕西省': {
    '西安市': ['新城区', '碑林区', '莲湖区', '灞桥区', '未央区', '雁塔区', '阎良区', '临潼区', '长安区', '高陵区', '鄠邑区', '蓝田县', '周至县'],
    '咸阳市': ['秦都区', '杨陵区', '渭城区', '三原县', '泾阳县', '乾县', '礼泉县', '永寿县', '长武县', '旬邑县', '淳化县', '武功县', '兴平市', '彬州市']
  },
  '安徽省': {
    '合肥市': ['瑶海区', '庐阳区', '蜀山区', '包河区', '长丰县', '肥东县', '肥西县', '庐江县', '巢湖市'],
    '芜湖市': ['镜湖区', '弋江区', '鸠江区', '三山区', '芜湖县', '繁昌县', '南陵县', '无为市'],
    '蚌埠市': ['龙子湖区', '蚌山区', '禹会区', '淮上区', '怀远县', '五河县', '固镇县']
  }
}

// 级联选择器选项
interface CascaderOption {
  value: string
  label: string
  children?: CascaderOption[]
}

const cascaderOptions = computed<CascaderOption[]>(() => {
  return Object.entries(regionData).map(([province, cities]) => ({
    value: province,
    label: province,
    children: Object.entries(cities).map(([city, districts]) => ({
      value: city,
      label: city,
      children: districts.map(district => ({
        value: district,
        label: district
      }))
    }))
  }))
})

// 级联选择器的值 [省, 市, 区]
const regionValue = ref<string[]>([])

const onRegionChange = (val: string[]) => {
  if (val && val.length === 3) {
    addressForm.province = val[0]
    addressForm.city = val[1]
    addressForm.district = val[2]
  } else {
    addressForm.province = ''
    addressForm.city = ''
    addressForm.district = ''
  }
}

const addressForm = reactive({
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  isDefault: false
})

const resetForm = () => {
  addressForm.name = ''
  addressForm.phone = ''
  addressForm.province = ''
  addressForm.city = ''
  addressForm.district = ''
  addressForm.detail = ''
  addressForm.isDefault = false
  regionValue.value = []
}

const openDialog = (addr?: any) => {
  if (addr) {
    isEdit.value = true
    editId.value = addr.id
    Object.assign(addressForm, addr)
    // 设置级联选择器的值
    if (addr.province && addr.city && addr.district) {
      regionValue.value = [addr.province, addr.city, addr.district]
    } else {
      regionValue.value = []
    }
  } else {
    isEdit.value = false
    editId.value = null
    resetForm()
  }
  dialogVisible.value = true
}

const useMyPhone = () => {
  if (userStore.userInfo?.phone) {
    addressForm.phone = userStore.userInfo.phone
    ElMessage.success('已填入个人手机号')
  }
}

const fetchAddresses = async () => {
  if (!userStore.userInfo?.id) return
  try {
    const res: any = await addressApi.getUserAddresses(userStore.userInfo.id)
    console.log('获取地址列表响应:', res)
    if (res?.code === 200 || res?.success) {
      addresses.value = res.data || []
      console.log('地址列表:', addresses.value)
    }
  } catch (error) {
    console.error('获取地址失败:', error)
  }
}

const saveAddress = async () => {
  try {
    const data = { ...addressForm, userId: userStore.userInfo?.id }
    console.log('保存地址请求数据:', data)
    let res: any
    if (isEdit.value && editId.value) {
      res = await addressApi.updateAddress(editId.value, data)
      console.log('更新地址响应:', res)
      if (res?.code === 200 || res?.success) {
        ElMessage.success('修改成功')
      } else {
        ElMessage.error(res?.message || '修改失败')
        return
      }
    } else {
      res = await addressApi.addAddress(data)
      console.log('添加地址响应:', res)
      if (res?.code === 200 || res?.success) {
        ElMessage.success('添加成功')
      } else {
        ElMessage.error(res?.message || '添加失败')
        return
      }
    }
    dialogVisible.value = false
    fetchAddresses()
  } catch (error: any) {
    console.error('保存地址失败:', error)
    ElMessage.error(error?.message || '保存失败')
  }
}

const setDefault = async (addr: any) => {
  try {
    await addressApi.setDefaultAddress(addr.id)
    ElMessage.success('设置成功')
    fetchAddresses()
  } catch (error) {
    ElMessage.error('设置失败')
  }
}

const deleteAddress = async (addr: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这个地址吗？', '提示', { type: 'warning' })
    await addressApi.deleteAddress(addr.id)
    ElMessage.success('删除成功')
    fetchAddresses()
  } catch {}
}

onMounted(() => {
  fetchAddresses()
})
</script>

<style scoped>
.address-page { min-height: 100vh; background: var(--white); position: relative; }

.address-page::before {
  content: '';
  position: fixed;
  top: 5%;
  right: -10%;
  width: 600px;
  height: 600px;
  background: linear-gradient(135deg, #D4E8FF, #B7D4FF);
  opacity: 0.15;
  filter: blur(80px);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  animation: floatAnim 20s ease-in-out infinite;
}

.address-page::after {
  content: '';
  position: fixed;
  bottom: 5%;
  left: -10%;
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, #E0F0FF, #C5D8FF);
  opacity: 0.12;
  filter: blur(80px);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  animation: floatAnim 20s ease-in-out infinite reverse;
}

@keyframes floatAnim {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}

.main-content { position: relative; z-index: 1; padding: 100px 0 80px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-header h1 { font-size: 2rem; font-weight: 600; color: var(--text-title); margin: 0; }
.add-btn { padding: 12px 28px; background: linear-gradient(135deg, var(--sakura), #5A8FD4); color: #fff; border: none; border-radius: var(--radius-xl); font-size: 15px; font-weight: 500; cursor: pointer; transition: all 0.3s; }
.add-btn:hover { box-shadow: 0 6px 20px rgba(90, 143, 212, 0.4); transform: translateY(-2px); }

.address-card { 
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(200, 220, 255, 0.5);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(90, 143, 212, 0.08);
  padding: 24px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.4s;
}
.address-card:hover { box-shadow: 0 12px 40px rgba(90, 143, 212, 0.15); border-color: rgba(143, 180, 230, 0.6); }
.addr-header { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.name { font-weight: 600; font-size: 16px; color: var(--text-title); }
.phone { color: var(--text-body); font-size: 15px; }
.default-tag { padding: 4px 12px; background: linear-gradient(135deg, var(--sakura), #5A8FD4); color: #fff; font-size: 12px; border-radius: 12px; }
.addr-detail { margin: 0; font-size: 15px; color: var(--text-body); }
.card-actions { display: flex; gap: 12px; }
.card-actions button { padding: 8px 18px; background: transparent; border: 1px solid rgba(90, 143, 212, 0.4); border-radius: var(--radius-md); font-size: 14px; color: var(--text-body); cursor: pointer; transition: all 0.3s; }
.card-actions button:hover { border-color: var(--sakura); color: var(--sakura); }
.card-actions button.delete:hover { border-color: #e74c3c; color: #e74c3c; }

.empty-state { 
  text-align: center;
  padding: 80px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(200, 220, 255, 0.5);
  border-radius: var(--radius-lg);
  color: var(--text-muted);
}
.empty-state svg { opacity: 0.4; margin-bottom: 16px; color: var(--sakura); }
.empty-state p { font-size: 16px; }

.region-row { display: flex; gap: 12px; }

.phone-input-row { display: flex; gap: 12px; width: 100%; }
.phone-input-row .el-input { flex: 1; }
.use-my-phone-btn {
  padding: 0 16px;
  background: linear-gradient(135deg, rgba(90, 143, 212, 0.1), rgba(183, 212, 255, 0.2));
  border: 1px solid rgba(90, 143, 212, 0.4);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: #5A8FD4;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s;
}
.use-my-phone-btn:hover {
  background: linear-gradient(135deg, rgba(90, 143, 212, 0.2), rgba(183, 212, 255, 0.3));
  border-color: #5A8FD4;
}

:deep(.el-dialog) { border-radius: var(--radius-lg); }
:deep(.el-dialog__header) { border-bottom: 1px solid rgba(200, 220, 255, 0.3); padding: 20px 24px; }
:deep(.el-dialog__body) { padding: 24px; }
:deep(.el-dialog__footer) { border-top: 1px solid rgba(200, 220, 255, 0.3); padding: 16px 24px; display: flex; justify-content: flex-end; gap: 12px; }
:deep(.el-form-item__label) { font-size: 14px; color: var(--text-body); font-weight: 500; }
:deep(.el-input__wrapper) { border-radius: var(--radius-md); background: rgba(255, 255, 255, 0.9) !important; border: 1px solid rgba(200, 220, 255, 0.4); box-shadow: none !important; }
:deep(.el-input__wrapper:hover), :deep(.el-input__wrapper.is-focus) { border-color: var(--sakura); }
:deep(.el-input__inner) { color: #333 !important; }
:deep(.el-cascader) { width: 100%; }
:deep(.el-cascader .el-input__wrapper) { 
  border-radius: var(--radius-md) !important; 
  background: rgba(255, 255, 255, 0.95) !important; 
  border: 1px solid rgba(200, 220, 255, 0.4) !important; 
  box-shadow: none !important; 
}
:deep(.el-cascader .el-input__inner) { color: #333 !important; }

.btn-cancel, .btn-confirm { padding: 12px 28px; border-radius: var(--radius-xl); font-size: 15px; cursor: pointer; }
.btn-cancel { background: transparent; border: 1px solid rgba(200, 200, 220, 0.4); color: var(--text-body); }
.btn-confirm { background: linear-gradient(135deg, var(--sakura), #5A8FD4); border: none; color: #fff; }

@media (max-width: 768px) {
  .address-card { flex-direction: column; align-items: stretch; gap: 16px; }
  .card-actions { justify-content: flex-end; }
}
</style>
