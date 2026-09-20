require 'natto'

class Markov
  NONWORD = "\n"

  attr_reader :markov_chain

  def initialize(text, chain_length = 2)
    @text = text
    @state = []
    @markov_chain ={}
    @chain_length = chain_length
    make_chain
  end

  def make_chain
    init_state
    tagger = Natto::MeCab.new('-Owakati')
    words = tagger.parse(@text).split(' ')
    words.each do |word|
      push_chain(word)
      next_state(word)
    end
    push_chain(NONWORD)
  end

  def push_chain(word)
    chain = @markov_chain
    (@chain_length - 1).times do |i|
      chain[@state[i]] = {} if chain[@state[i]].nil?
      chain = chain[@state[i]]
    end
    chain[@state[@chain_length - 1]] = [] if chain[@state[@chain_length - 1]].nil?
    chain[@state[@chain_length - 1]].push(word)
  end

  def each
    init_state
    loop do
      p = pick
      if p == NONWORD
        break
      else
        yield p
      end
      next_state(p)
    end
  end

  def pick
    chain = @markov_chain
    @chain_length.times do |i|
      chain = chain[@state[i]]
    end
    r = rand(chain.length)
    chain[r]
  end

  def init_state
    @state = []
    @chain_length.times do |n|
      @state[n] = NONWORD
    end
  end

  def next_state(word)
    (@chain_length - 1).times do |i|
      @state[i] = @state[i + 1]
    end
    @state[@chain_length - 1] = word
  end
end

