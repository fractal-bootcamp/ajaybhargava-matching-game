import { type RouteConfig, index, prefix, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route('sign-in/*', 'routes/sign-in.tsx'),
    ...prefix("/start", [
        route(":id/play", "routes/play/game.tsx"),
    ]),
] satisfies RouteConfig;
