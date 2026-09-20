require File.expand_path('../markov', __FILE__)

text = File::open(ARGV[0]).read

markov = Markov.new(text, ARGV[1].to_i)
i = 0
markov.each do |word|
  break if i > 1000
  print word
  i += 1
end
puts

