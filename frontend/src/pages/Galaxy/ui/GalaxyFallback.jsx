import { seededRandom } from '../utils/random.js'

const random = seededRandom(2709)
const stars = Array.from({ length: 180 }, () => ({
  x: random() * 1440, y: random() * 900,
  radius: 0.4 + random() * 0.9, opacity: 0.15 + random() * 0.6,
}))

export default function GalaxyFallback({ failed }) {
  return (
    <>
      <svg className="GalaxyStaticSky" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {stars.map((star, index) => (
          <circle key={index} cx={star.x} cy={star.y} r={star.radius} fill="#e5e8ef" opacity={star.opacity} />
        ))}
      </svg>
      <section className="GalaxyFallback" aria-labelledby="galaxy-static-title">
        <p className="GalaxyEyebrow">Still in the stars</p>
        <h2 id="galaxy-static-title">A quieter view.</h2>
        <p>{failed ? 'The interactive sky is unavailable on this device.' : 'A still sky, with room to explore the portfolio.'}</p>
        <nav aria-label="Explore the portfolio">
          <a href="/#about">About Sanam <span aria-hidden="true">↗</span></a>
          <a href="/#projects">Projects <span aria-hidden="true">↗</span></a>
          <a href="/#system-controls">Backend Lab <span aria-hidden="true">↗</span></a>
        </nav>
      </section>
    </>
  )
}
