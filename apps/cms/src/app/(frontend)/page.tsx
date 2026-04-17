import config from "@/payload.config";

export default async function HomePage() {
  const payloadConfig = await config;
  const adminPath = payloadConfig.routes.admin.replace(/\/$/, "");
  const loginHref = `${adminPath}/login`;

  return (
    <div className="home">
      <div className="content">
        <h1>Contorro</h1>
        <div className="links">
          <a className="admin" href={loginHref}>
            Login
          </a>
        </div>
      </div>
    </div>
  );
}
