import http from "k6/http";
import { sleep, check } from "k6";

export const options = {
  vus: 100,          // 100 concurrent users
  duration: "2m",    // Run for 2 minutes
};

export default function () {
  const res = http.get("https://sigai-crime-lab.vercel.app/login");

  check(res, {
    "status is 200": (r) => r.status === 200,
  });

  sleep(1);
}