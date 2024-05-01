import axios from "axios";
const service = axios.create({
	baseURL: '', // url = base url + request url
	timeout: 30000,// request timeout
	// withCredentials:true
})
// 请求拦截
service.interceptors.request.use(
	(config: any) => {
		return config
	},
	(error: any) => {
		return Promise.reject(error)
	}
)

// 响应拦截
service.interceptors.response.use(
	(response: any) => {
		const res = response.data
		if (res.success) {
			return res.data
		} else {
			return Promise.reject(res.message)
		}
	},
	(error: any) => {
		if (error.response) {
			switch (error.response.status) {
				case 500:
					console.log('500');
					break
				default:

			}
		}
		return Promise.reject(error)
	}
)

export default service