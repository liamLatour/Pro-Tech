class Vector {
    constructor(x, y){
        this.x = x;
        this.y = y;
    }

    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }
    
    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    mul(a) {
        this.x *= a;
        this.y *= a;
        return this;
    }

    cross(v) {
        return this.x * v.y - this.y * v.x;
    }

    dot(v) {
        return this.x * v.x + this.y * v.y;
    }

    length() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }

    normalize() {
        let length = this.length();
        this.x /= length;
        this.y /= length;
        return this;
    }


    /*
    back(a, b, d) {
        let slope = this.normalize(this.sub(a, b));

        return this.sub(a, this.mul(slope, d));
    }

    offset_line(a, b, d) {
        let slope = this.sub(a, b);
        let direction = this.normalize([-slope[1], slope[0]]);

        return [this.add(a, this.mul(direction, d)), this.add(b, this.mul(direction, d))];
    }

    offset(a, b, d) {
        let slope = this.sub(a, b);
        let direction = this.normalize([-slope[1], slope[0]]);

        return this.add(a, this.mul(direction, d));
    }

    intersects(p, v1, q, v2) {
        if (p == q || p == v2 || v1 == q || v1 == v2) {
            return false;
        }

        let r = this.sub(v1, p);
        let s = this.sub(v2, q);

        let rs = this.cross(r, s);
        let qp = this.sub(q, p)

        let t = this.cross(qp, s) / rs;
        let u = this.cross(qp, r) / rs;

        return rs != 0 && t <= 1 && t >= 0 && u <= 1 && u >= 0;
    }
    */
}