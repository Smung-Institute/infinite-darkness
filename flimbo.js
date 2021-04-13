///////////////////////////
//        Vectors        //
///////////////////////////
V2 = (x, y) => [x, y]
dot = (u, v) => u[0] * v[0] + u[1] * v[1];
norm2 = (u) => dot(u, u);
norm = (u) => Math.sqrt(norm2(u));
vadd = (u, v) => V2(u[0] + v[0], u[1] + v[1]);
smul = (a, u) => V2(a * u[0], a * u[1]);
vsub = (u, v) => V2(u[0] - v[0], u[1] - v[1]);
sdiv = (a, u) => V2(u[0] / a, u[1] / a);
normalize = (u) => sdiv(norm(u), u);
vneg = (u) => smul(-1, u);
cross = (u, v) => u[0] * v[1] - u[1] * v[0];
angle = (u, v) => {
    var u = normalize(u);
    var v = normalize(v);
    return Math.atan2(cross(u, v), dot(u, v));
}
rotate = (theta, v) => V2(Math.cos(theta) * v[0] - Math.sin(theta) * v[1], Math.sin(theta) * v[0] + Math.cos(theta) * v[1])
perp = (v) => V2(-v[1], v[0]);
reflect = (v, n) => vsub(v, smul(2 * dot(v, n), n));

///////////////////////////
//        Optics         //
///////////////////////////

Ray = (pos, dir) => ({
    pos: pos,
    dir: normalize(dir)
});

prop = (ray, t) => Ray(vadd(ray.pos, smul(t, ray.dir)), ray.dir);

prop_draw = (ray, t, ctx) => {
    var new_ray = prop(ray, t)
    line_artist(ray.pos, new_ray.pos)(ctx)
    return new_ray
}

Hit = (pos, norm, t) => ({
    pos: pos,
    normal: normalize(norm),
    t: t
});


line_collider = (r0, r1) => (ray) => {
    var v1 = vsub(ray.pos, r0);
    var v2 = vsub(r1, r0);
    var v3 = perp(ray.dir);

    var t1 = cross(v2, v1) / dot(v2, v3);
    var t2 = dot(v1, v3) / dot(v2, v3);

    if (0 <= t2 && t2 <= 1 && t1 > 0.001) {
        var normal = normalize(perp(v2));
        if (dot(normal, ray.dir) > 0) {
            normal = vneg(normal);
        }
        return Hit(prop(ray, t1).pos, normal, t1);
    }
    else {
        return null;
    }
}

///////////////////////////
//       Materials       //
///////////////////////////    


Objekt = (collider, material, draw) => ({
    collider: collider,
    material: material,
    draw: draw
})


shiny_material = (hit, ray) => {
    return Ray(hit.pos, reflect(ray.dir, hit.normal));
}

absorbing_material = (hit, ray) => {
    return null;
}

line_artist = (r0, r1) => (ctx) => {
    ctx.strokeStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(...r0);
    ctx.lineTo(...r1);
    ctx.stroke();
}

line_collider = (r0, r1) => (ray) => {
    var v1 = vsub(ray.pos, r0);
    var v2 = vsub(r1, r0);
    var v3 = perp(ray.dir);

    var t1 = cross(v2, v1) / dot(v2, v3);
    var t2 = dot(v1, v3) / dot(v2, v3);

    if (0 <= t2 && t2 <= 1 && t1 > 0) {
        var normal = normalize(perp(v2));
        if (dot(normal, ray.dir) > 0) {
            normal = vneg(normal);
        }
        return Hit(prop(ray, t1).pos, normal, t1);
    }
    else {
        return null;
    }
}

shiny_line = (r0, r1) => {
    return Objekt(
        line_collider(r0, r1),
        shiny_material,
        line_artist(r0, r1)
    )

}

union = (...geoms) => ray => {
    var bestHit = null;
    geoms.forEach(geom => {
        hit = geom(ray);
        if (hit != null) {
            if (bestHit == null || hit.t < bestHit.t) {
                bestHit = hit;
            }
        }
    });
    return bestHit;
}

rect_collider = (x, y, w, h) => union(
    line_collider(V2(x, y), V2(x + w, y)),
    line_collider(V2(x + w, y), V2(x + w, y + h)),
    line_collider(V2(x + w, y + h), V2(x, y + h)),
    line_collider(V2(x, y + h), V2(x, y))
)

boundary = (x, y, w, h) => Objekt(rect_collider(x, y, w, h), absorbing_material, (ctx) => { })
