// 백엔드 API 호출 헬퍼 (인증 없음)

// 공통 요청 함수
async function request(method, url, body) {
  const headers = { "Content-Type": "application/json" };

  const res = await fetch(`/api${url}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const message = (data && data.error) || "요청에 실패했습니다.";
    throw new Error(message);
  }
  return data;
}

export const api = {
  get: (url) => request("GET", url),
  post: (url, body) => request("POST", url, body),
  put: (url, body) => request("PUT", url, body),
  del: (url) => request("DELETE", url),
};
